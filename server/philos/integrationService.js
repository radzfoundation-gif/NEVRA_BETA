/**
 * Philos Integration Service
 * Handles OAuth connections to Gmail, GitHub, Slack, Google Drive, Notion, Calendar
 */

const OAUTH_CONFIGS = {
  gmail: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  google_calendar: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  google_drive: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['repo', 'read:user', 'user:email'],
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
  },
  slack: {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['channels:read', 'chat:write', 'users:read'],
    clientIdEnv: 'SLACK_CLIENT_ID',
    clientSecretEnv: 'SLACK_CLIENT_SECRET',
  },
  notion: {
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: [],
    clientIdEnv: 'NOTION_CLIENT_ID',
    clientSecretEnv: 'NOTION_CLIENT_SECRET',
  },
};

export class PhilosIntegrationService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.frontendUrl = process.env.FRONTEND_URL || 'https://noir.biz.id';
  }

  // Get OAuth authorization URL for a provider
  getAuthUrl(provider, userId) {
    const config = OAUTH_CONFIGS[provider];
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    const clientId = process.env[config.clientIdEnv];
    if (!clientId) throw new Error(`${config.clientIdEnv} not configured`);

    const redirectUri = `${this.frontendUrl}/api/philos/integrations/${provider}/callback`;
    const state = Buffer.from(JSON.stringify({ userId, provider })).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      access_type: 'offline', // for Google refresh tokens
      prompt: 'consent',
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  // Handle OAuth callback — exchange code for tokens
  async handleCallback(provider, code, userId) {
    const config = OAUTH_CONFIGS[provider];
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];
    const redirectUri = `${this.frontendUrl}/api/philos/integrations/${provider}/callback`;

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
    });

    const tokens = await response.json();
    if (tokens.error) throw new Error(`OAuth error: ${tokens.error_description || tokens.error}`);

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    await this.supabase.from('philos_integrations').upsert({
      user_id: userId,
      provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: expiresAt,
      scopes: config.scopes,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });

    console.log(`✅ [Philos] ${provider} integration connected for user ${userId}`);
    return { success: true, provider };
  }

  // Get a valid access token (auto-refresh if expired)
  async getToken(userId, provider) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data } = await this.supabase
      .from('philos_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .maybeSingle();

    if (!data) throw new Error(`${provider} not connected`);

    // Check if token is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return await this.refreshToken(userId, provider, data.refresh_token);
    }

    return data.access_token;
  }

  // Refresh an expired token
  async refreshToken(userId, provider, refreshToken) {
    const config = OAUTH_CONFIGS[provider];
    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
    });

    const tokens = await response.json();
    if (tokens.error) throw new Error(`Token refresh failed: ${tokens.error}`);

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    await this.supabase.from('philos_integrations').update({
      access_token: tokens.access_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('provider', provider);

    return tokens.access_token;
  }

  // Revoke an integration
  async revokeIntegration(userId, provider) {
    if (!this.supabase) return;
    await this.supabase
      .from('philos_integrations')
      .update({ is_active: false, access_token: null, refresh_token: null })
      .eq('user_id', userId)
      .eq('provider', provider);
    console.log(`🔌 [Philos] ${provider} integration revoked for user ${userId}`);
  }

  // List all active integrations for a user
  async listIntegrations(userId) {
    if (!this.supabase) return [];
    const { data } = await this.supabase
      .from('philos_integrations')
      .select('provider, scopes, is_active, created_at, updated_at')
      .eq('user_id', userId)
      .eq('is_active', true);
    return data || [];
  }

  // ── Integration Actions ──────────────────────────────

  // Read Gmail inbox (latest N emails)
  async readGmail(userId, maxResults = 5) {
    const token = await this.getToken(userId, 'gmail');
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const list = await listRes.json();
    if (!list.messages) return [];

    const emails = await Promise.all(
      list.messages.slice(0, maxResults).map(async (msg) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        return {
          id: msg.id,
          subject: headers.find(h => h.name === 'Subject')?.value || '(no subject)',
          from: headers.find(h => h.name === 'From')?.value || '',
          date: headers.find(h => h.name === 'Date')?.value || '',
          snippet: msgData.snippet || '',
        };
      })
    );
    return emails;
  }

  // Send an email via Gmail
  async sendGmail(userId, { to, subject, body }) {
    const token = await this.getToken(userId, 'gmail');
    const email = [`To: ${to}`, `Subject: ${subject}`, '', body].join('\n');
    const encoded = Buffer.from(email).toString('base64url');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded }),
    });
    return await res.json();
  }

  // Get GitHub repos
  async getGithubRepos(userId) {
    const token = await this.getToken(userId, 'github');
    const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    const repos = await res.json();
    return repos.map(r => ({ name: r.full_name, description: r.description, url: r.html_url, stars: r.stargazers_count }));
  }

  // Get Google Calendar events
  async getCalendarEvents(userId, maxResults = 5) {
    const token = await this.getToken(userId, 'google_calendar');
    const now = new Date().toISOString();
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${maxResults}&timeMin=${now}&orderBy=startTime&singleEvents=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    return (data.items || []).map(e => ({
      title: e.summary,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      location: e.location,
    }));
  }
}
