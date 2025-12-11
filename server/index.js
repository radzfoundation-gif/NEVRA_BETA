import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 8788;

// CORS configuration: use CORS_ORIGIN if set, otherwise allow all origins
const corsOrigin = process.env.CORS_ORIGIN 
  ? (process.env.CORS_ORIGIN === 'true' ? true : process.env.CORS_ORIGIN)
  : true;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '12mb' }));

const PROVIDER_KEYS = {
  groq: process.env.GROQ_API_KEY,
  deepseek: process.env.DEEPSEEK_API_KEY,
  openai: process.env.OPENROUTER_API_KEY,
  grok: process.env.GROQ_API_KEY, // Grok uses same Groq API key
};

const MODELS = {
  groq: 'llama-3.3-70b-versatile',
  deepseek: 'deepseek-chat',
  openai: 'openai/gpt-4o',
  grok: 'moonshotai/kimi-k2-instruct-0905', // Kimi K2 via Groq
};

// Max tokens configuration (can be overridden via env)
const MAX_TOKENS = {
  groq: {
    builder: parseInt(process.env.GROQ_MAX_TOKENS_BUILDER) || 8192,
    tutor: parseInt(process.env.GROQ_MAX_TOKENS_TUTOR) || 4096,
  },
  deepseek: parseInt(process.env.DEEPSEEK_MAX_TOKENS) || 4096,
  openai: parseInt(process.env.OPENROUTER_MAX_TOKENS) || 2000, // Default safe value
  grok: {
    builder: parseInt(process.env.GROK_MAX_TOKENS_BUILDER) || 4096,
    tutor: parseInt(process.env.GROK_MAX_TOKENS_TUTOR) || 4096,
  },
};

// Initialize SDK clients
const groqClient = PROVIDER_KEYS.groq ? new Groq({ apiKey: PROVIDER_KEYS.groq }) : null;
const openaiClient = PROVIDER_KEYS.openai ? new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: PROVIDER_KEYS.openai,
  defaultHeaders: {
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://rlabs-studio.cloud',
    'X-Title': process.env.OPENROUTER_SITE_NAME || 'Nevra',
  },
}) : null;
// Grok (Kimi K2) uses Groq SDK with different model

const formatHistory = (history = []) =>
  history
    .map((msg) => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts?.[0]?.text ?? '',
    }))
    .filter((msg) => msg.content);

const buildOpenAIUserContent = (prompt, images = []) => {
  const content = [{ type: 'text', text: prompt }];
  images.forEach((img) => {
    content.push({
      type: 'image_url',
      image_url: { url: img },
    });
  });
  return content;
};


app.post('/api/generate', async (req, res) => {
  const {
    prompt,
    history = [],
    systemPrompt,
    provider = 'groq',
    mode = 'builder',
    images = [],
  } = req.body || {};

  if (!prompt || !systemPrompt) {
    return res.status(400).json({ error: 'Missing prompt or systemPrompt' });
  }

  if (!PROVIDER_KEYS[provider]) {
    return res.status(500).json({ error: `${provider} API key not configured` });
  }

  if (provider !== 'openai' && images.length) {
    return res
      .status(400)
      .json({ error: `${provider} does not support image input. Use openai provider.` });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const messagesBase = [
      { role: 'system', content: systemPrompt },
      ...formatHistory(history),
    ];

    let content;

    switch (provider) {
      case 'openai': {
        if (!openaiClient) {
          return res.status(500).json({ error: 'OpenRouter client not initialized' });
        }

        const messages = [
          ...messagesBase,
          { role: 'user', content: buildOpenAIUserContent(prompt, images) },
        ];

        // Use configurable max_tokens, with retry mechanism for credit errors
        const baseMaxTokens = MAX_TOKENS.openai;
        // Try with different max_tokens values if credit limit error occurs
        const maxTokensOptions = [baseMaxTokens, Math.floor(baseMaxTokens * 0.75), Math.floor(baseMaxTokens * 0.5), Math.floor(baseMaxTokens * 0.25)];
        let openaiContent = null;
        let lastError = null;

        for (const maxTokens of maxTokensOptions) {
          try {
            const completion = await openaiClient.chat.completions.create({
              model: MODELS.openai,
              messages,
              temperature: 0.5,
              max_tokens: maxTokens,
            }, {
              signal: controller.signal,
            });

            openaiContent = completion.choices[0]?.message?.content;
            break; // Success, exit loop
          } catch (sdkErr) {
            const errorMsg = sdkErr?.error?.message || sdkErr?.message || String(sdkErr);
            lastError = sdkErr;
            
            // If it's a credit limit error, try with lower max_tokens
            if (errorMsg.toLowerCase().includes('credit') || errorMsg.toLowerCase().includes('afford')) {
              console.log(`[${provider}] Credit limit hit with ${maxTokens} tokens, retrying with lower value...`);
              continue; // Try next lower value
            }
            
            // If it's not a credit error, break and return error
            console.error(`[${provider}] SDK error:`, sdkErr);
            return res.status(sdkErr?.status || 500).json({
              error: `OpenRouter API Error: ${errorMsg}`,
              detail: sdkErr?.error || errorMsg,
            });
          }
        }

        // If all attempts failed due to credits
        if (!openaiContent && lastError) {
          const errorMsg = lastError?.error?.message || lastError?.message || String(lastError);
          return res.status(lastError?.status || 500).json({
            error: `OpenRouter API Error: ${errorMsg}`,
            detail: lastError?.error || errorMsg,
          });
        }
        
        content = openaiContent;
        break;
      }
      case 'groq':
      default: {
        if (!groqClient) {
          return res.status(500).json({ error: 'Groq client not initialized' });
        }

        const messages = [
          ...messagesBase,
          { role: 'user', content: prompt },
        ];

        try {
          const completion = await groqClient.chat.completions.create({
            model: MODELS.groq,
            messages,
            temperature: 0.5,
            max_tokens: mode === 'builder' ? MAX_TOKENS.groq.builder : MAX_TOKENS.groq.tutor,
          }, {
            signal: controller.signal,
          });

          content = completion.choices[0]?.message?.content;
        } catch (sdkErr) {
          console.error(`[${provider}] SDK error:`, sdkErr);
          const errorMsg = sdkErr?.error?.message || sdkErr?.message || String(sdkErr);
          return res.status(sdkErr?.status || 500).json({
            error: `Groq API Error: ${errorMsg}`,
            detail: sdkErr?.error || errorMsg,
          });
        }
        break;
      }
      case 'deepseek': {
        // DeepSeek tetap pakai fetch karena tidak ada official SDK
        const url = 'https://api.deepseek.com/chat/completions';
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PROVIDER_KEYS.deepseek}`,
        };
        const body = {
          model: MODELS.deepseek,
          messages: [...messagesBase, { role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: MAX_TOKENS.deepseek,
          stream: false,
        };

        const resp = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const text = await resp.text();
          console.error(`[${provider}] Error response:`, text.slice(0, 500));
          return res
            .status(resp.status)
            .json({ 
              error: `${provider.toUpperCase()} API Error (${resp.status}): ${resp.statusText}`, 
              detail: text.slice(0, 2000) 
            });
        }

        const data = await resp.json();
        content = data?.choices?.[0]?.message?.content;
        break;
      }
      case 'grok': {
        // Grok (Kimi K2) uses Groq SDK with moonshotai/kimi-k2-instruct-0905 model
        // Use same temperature and settings as other providers for consistency
        if (!groqClient) {
          return res.status(500).json({ error: 'Groq client not initialized' });
        }

        const messages = [
          ...messagesBase,
          { role: 'user', content: prompt },
        ];

        try {
          const completion = await groqClient.chat.completions.create({
            model: MODELS.grok,
            messages,
            temperature: 0.5, // Same as groq and other providers
            max_tokens: mode === 'builder' ? MAX_TOKENS.grok.builder : MAX_TOKENS.grok.tutor,
          }, {
            signal: controller.signal,
          });

          content = completion.choices[0]?.message?.content;
        } catch (sdkErr) {
          console.error(`[${provider}] SDK error:`, sdkErr);
          const errorMsg = sdkErr?.error?.message || sdkErr?.message || String(sdkErr);
          return res.status(sdkErr?.status || 500).json({
            error: `Grok (Kimi K2) API Error: ${errorMsg}`,
            detail: sdkErr?.error || errorMsg,
          });
        }
        break;
      }
    }

    if (!content) {
      console.error(`[${provider}] No content in response`);
      return res.status(500).json({ 
        error: `${provider.toUpperCase()} response missing content`
      });
    }

    return res.json({ content });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'Upstream timeout' });
    }
    console.error('Proxy error', err);
    return res.status(500).json({ error: 'Proxy error', detail: err?.message });
  } finally {
    clearTimeout(timeout);
  }
});

// Root ping for platform health checks
app.get('/', (_req, res) => {
  res.type('text/html').send('<h1>Nevra API OK</h1>');
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Deployment endpoint
app.post('/api/deploy', async (req, res) => {
  const { code, platform, projectName, apiToken } = req.body || {};

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  if (!platform || !['vercel', 'netlify'].includes(platform)) {
    return res.status(400).json({ error: 'Platform must be vercel or netlify' });
  }

  try {
    if (platform === 'vercel') {
      const token = apiToken || process.env.VERCEL_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'Vercel token not configured. Add VERCEL_TOKEN to .env' });
      }

      // Create Vercel deployment
      // Note: Vercel API v13 requires different format - using simplified approach
      const vercelResponse = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName || `nevra-${Date.now()}`,
          files: [
            {
              file: '/index.html',
              data: Buffer.from(code).toString('base64'),
            },
          ],
          projectSettings: {
            framework: null,
          },
        }),
      });

      if (!vercelResponse.ok) {
        const error = await vercelResponse.json();
        return res.status(500).json({ 
          error: `Vercel deployment failed: ${error.error?.message || JSON.stringify(error)}` 
        });
      }

      const deployment = await vercelResponse.json();
      return res.json({
        success: true,
        url: deployment.url ? `https://${deployment.url}` : undefined,
        deploymentId: deployment.id,
      });
    } else if (platform === 'netlify') {
      const token = apiToken || process.env.NETLIFY_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'Netlify token not configured. Add NETLIFY_TOKEN to .env' });
      }

      // Create Netlify site
      const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName || `nevra-${Date.now()}`,
        }),
      });

      if (!siteResponse.ok) {
        const error = await siteResponse.json();
        return res.status(500).json({ 
          error: `Netlify site creation failed: ${error.message || 'Unknown error'}` 
        });
      }

      const site = await siteResponse.json();

      // Deploy files using Netlify API
      const formData = new FormData();
      const blob = new Blob([code], { type: 'text/html' });
      formData.append('file', blob, 'index.html');

      const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!deployResponse.ok) {
        const error = await deployResponse.json();
        return res.status(500).json({ 
          error: `Netlify deployment failed: ${error.message || 'Unknown error'}` 
        });
      }

      const deployment = await deployResponse.json();
      return res.json({
        success: true,
        url: `https://${site.subdomain}.netlify.app`,
        deploymentId: deployment.id,
      });
    }
  } catch (error) {
    console.error('Deployment error:', error);
    return res.status(500).json({ 
      error: `Deployment failed: ${error.message || 'Unknown error'}` 
    });
  }
});

// Deployment status endpoint
app.post('/api/deploy/status', async (req, res) => {
  const { deploymentId, platform } = req.body || {};

  if (!deploymentId || !platform) {
    return res.status(400).json({ error: 'deploymentId and platform are required' });
  }

  try {
    if (platform === 'vercel') {
      const token = process.env.VERCEL_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'Vercel token not configured' });
      }

      const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to get deployment status' });
      }

      const deployment = await response.json();
      return res.json({
        status: deployment.readyState === 'READY' ? 'ready' : 'building',
        url: deployment.url ? `https://${deployment.url}` : undefined,
      });
    } else if (platform === 'netlify') {
      const token = process.env.NETLIFY_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'Netlify token not configured' });
      }

      const response = await fetch(`https://api.netlify.com/api/v1/deploys/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to get deployment status' });
      }

      const deployment = await response.json();
      return res.json({
        status: deployment.state === 'ready' ? 'ready' : 'building',
        url: deployment.deploy_ssl_url,
      });
    }
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ error: 'Failed to get deployment status' });
  }
});

// Deployment endpoint
app.post('/api/deploy', async (req, res) => {
  const { code, platform, projectName, apiToken } = req.body || {};

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  if (!platform || !['vercel', 'netlify'].includes(platform)) {
    return res.status(400).json({ error: 'Platform must be vercel or netlify' });
  }

  try {
    if (platform === 'vercel') {
      const token = apiToken || process.env.VERCEL_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'Vercel token not configured. Add VERCEL_TOKEN to .env' });
      }

      // Create Vercel deployment
      const vercelResponse = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName || `nevra-${Date.now()}`,
          files: [
            {
              file: '/index.html',
              data: Buffer.from(code).toString('base64'),
            },
          ],
          projectSettings: {
            framework: null,
          },
        }),
      });

      if (!vercelResponse.ok) {
        const error = await vercelResponse.json();
        return res.status(500).json({ 
          error: `Vercel deployment failed: ${error.error?.message || JSON.stringify(error)}` 
        });
      }

      const deployment = await vercelResponse.json();
      return res.json({
        success: true,
        url: deployment.url ? `https://${deployment.url}` : undefined,
        deploymentId: deployment.id,
      });
    } else if (platform === 'netlify') {
      const token = apiToken || process.env.NETLIFY_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'Netlify token not configured. Add NETLIFY_TOKEN to .env' });
      }

      // Create Netlify site
      const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName || `nevra-${Date.now()}`,
        }),
      });

      if (!siteResponse.ok) {
        const error = await siteResponse.json();
        return res.status(500).json({ 
          error: `Netlify site creation failed: ${error.message || 'Unknown error'}` 
        });
      }

      const site = await siteResponse.json();

      // Deploy files - Netlify accepts direct file upload
      const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            'index.html': code,
          },
        }),
      });

      if (!deployResponse.ok) {
        const error = await deployResponse.json();
        return res.status(500).json({ 
          error: `Netlify deployment failed: ${error.message || 'Unknown error'}` 
        });
      }

      const deployment = await deployResponse.json();
      return res.json({
        success: true,
        url: `https://${site.subdomain}.netlify.app`,
        deploymentId: deployment.id,
      });
    }
  } catch (error) {
    console.error('Deployment error:', error);
    return res.status(500).json({ 
      error: `Deployment failed: ${error.message || 'Unknown error'}` 
    });
  }
});

// Deployment status endpoint
app.post('/api/deploy/status', async (req, res) => {
  const { deploymentId, platform } = req.body || {};

  if (!deploymentId || !platform) {
    return res.status(400).json({ error: 'deploymentId and platform are required' });
  }

  try {
    if (platform === 'vercel') {
      const token = process.env.VERCEL_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'Vercel token not configured' });
      }

      const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to get deployment status' });
      }

      const deployment = await response.json();
      return res.json({
        status: deployment.readyState === 'READY' ? 'ready' : 'building',
        url: deployment.url ? `https://${deployment.url}` : undefined,
      });
    } else if (platform === 'netlify') {
      const token = process.env.NETLIFY_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'Netlify token not configured' });
      }

      const response = await fetch(`https://api.netlify.com/api/v1/deploys/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to get deployment status' });
      }

      const deployment = await response.json();
      return res.json({
        status: deployment.state === 'ready' ? 'ready' : 'building',
        url: deployment.deploy_ssl_url,
      });
    }
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ error: 'Failed to get deployment status' });
  }
});

// GitHub OAuth Routes
app.get('/api/github/auth', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'GitHub Client ID not configured' });
  }
  
  const redirectUri = process.env.GITHUB_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/github/callback`;
  const scope = 'repo';
  const state = req.query.state || Math.random().toString(36).substring(7);
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  
  res.json({ authUrl, state });
});

app.get('/api/github/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?github_error=no_code`);
  }
  
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/github/callback`;
    
    if (!clientId || !clientSecret) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?github_error=not_configured`);
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?github_error=${tokenData.error}`);
    }
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?github_token=${tokenData.access_token}&state=${state}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?github_error=server_error`);
  }
});

app.post('/api/github/repos', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(401).json({ error: 'GitHub token required' });
  }
  
  try {
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch repositories' });
    }
    
    const repos = await response.json();
    res.json({ repos: repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
    })) });
  } catch (error) {
    console.error('GitHub repos error:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

app.post('/api/github/create-repo', async (req, res) => {
  const { token, name, description, isPrivate } = req.body;
  
  if (!token || !name) {
    return res.status(400).json({ error: 'Token and repository name required' });
  }
  
  try {
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description: description || '',
        private: isPrivate || false,
        auto_init: true,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message || 'Failed to create repository' });
    }
    
    const repo = await response.json();
    res.json({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
    });
  } catch (error) {
    console.error('GitHub create repo error:', error);
    res.status(500).json({ error: 'Failed to create repository' });
  }
});

app.post('/api/github/push', async (req, res) => {
  const { token, repo, files, commitMessage, branch } = req.body;
  
  if (!token || !repo || !files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Token, repository, and files required' });
  }
  
  try {
    const repoFullName = typeof repo === 'string' ? repo : repo.fullName;
    const targetBranch = branch || 'main';
    const message = commitMessage || 'Update from NEVRA';
    
    // Get current tree SHA
    const refResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/ref/heads/${targetBranch}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    
    let baseTreeSha;
    if (refResponse.ok) {
      const refData = await refResponse.json();
      const commitResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/commits/${refData.object.sha}`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (commitResponse.ok) {
        const commitData = await commitResponse.json();
        baseTreeSha = commitData.tree.sha;
      }
    }
    
    // Create blobs for all files
    const blobPromises = files.map(async (file) => {
      const content = typeof file === 'string' ? file : file.content;
      const path = typeof file === 'string' ? 'index.html' : (file.path || file.name || 'index.html');
      const blobContent = Buffer.from(content).toString('base64');
      
      const blobResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/blobs`, {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: blobContent,
          encoding: 'base64',
        }),
      });
      
      if (!blobResponse.ok) {
        throw new Error(`Failed to create blob for ${path}`);
      }
      
      const blobData = await blobResponse.json();
      return {
        path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      };
    });
    
    const treeItems = await Promise.all(blobPromises);
    
    // Create tree
    const treeResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    });
    
    if (!treeResponse.ok) {
      const error = await treeResponse.json();
      throw new Error(error.message || 'Failed to create tree');
    }
    
    const treeData = await treeResponse.json();
    
    // Get current commit SHA
    let parentSha = null;
    if (refResponse.ok) {
      const refData = await refResponse.json();
      parentSha = refData.object.sha;
    }
    
    // Create commit
    const commitResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/commits`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: parentSha ? [parentSha] : [],
      }),
    });
    
    if (!commitResponse.ok) {
      const error = await commitResponse.json();
      throw new Error(error.message || 'Failed to create commit');
    }
    
    const commitData = await commitResponse.json();
    
    // Update branch reference
    const updateRefResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/refs/heads/${targetBranch}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: commitData.sha,
      }),
    });
    
    if (!updateRefResponse.ok) {
      const error = await updateRefResponse.json();
      throw new Error(error.message || 'Failed to update branch');
    }
    
    res.json({
      success: true,
      url: `https://github.com/${repoFullName}`,
      commitSha: commitData.sha,
    });
  } catch (error) {
    console.error('GitHub push error:', error);
    res.status(500).json({ error: error.message || 'Failed to push to GitHub' });
  }
});

// Web Search endpoint (for Tutor mode)
app.post('/api/search', async (req, res) => {
  const { query, maxResults = 10 } = req.body || {};

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    // Use Tavily API for web search (free tier available)
    // Alternative: SerpAPI, Google Custom Search, or DuckDuckGo
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    
    if (!TAVILY_API_KEY) {
      // Fallback: Use DuckDuckGo HTML scraping (no API key needed)
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      // For now, return mock results (implement actual search later)
      const mockResults = [
        {
          title: `Search results for: ${query}`,
          url: searchUrl,
          snippet: `Search results for "${query}". To enable real web search, add TAVILY_API_KEY to your environment variables.`,
          source: 'DuckDuckGo',
        },
      ];

      return res.json({
        query,
        results: mockResults.slice(0, maxResults),
        totalResults: mockResults.length,
        searchTime: 0.5,
      });
    }

    // Use Tavily API for real search
    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        max_results: maxResults,
        search_depth: 'basic',
      }),
    });

    if (!tavilyResponse.ok) {
      throw new Error(`Tavily API error: ${tavilyResponse.statusText}`);
    }

    const tavilyData = await tavilyResponse.json();
    
    const results = (tavilyData.results || []).map((result) => ({
      title: result.title || 'No title',
      url: result.url || '',
      snippet: result.content || '',
      source: new URL(result.url || '').hostname,
      relevanceScore: result.score,
    }));

    res.json({
      query,
      results,
      totalResults: tavilyData.results?.length || 0,
      searchTime: tavilyData.query_time || 0,
    });
  } catch (error) {
    console.error('Web search error:', error);
    res.status(500).json({ 
      error: error?.message || 'Web search failed',
      query,
      results: [],
      totalResults: 0,
      searchTime: 0,
    });
  }
});

// Document parsing endpoint
app.post('/api/parse-document', async (req, res) => {
  // Note: This requires multer for file uploads
  // For now, return error message about implementation
  res.status(501).json({ 
    error: 'Document parsing not yet implemented. Please install multer and pdf-parse packages.',
    message: 'To enable document parsing, install: npm install multer pdf-parse mammoth',
  });
});

// Code execution endpoint (Python)
app.post('/api/execute-code', async (req, res) => {
  const { code, language = 'python' } = req.body || {};

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  if (language !== 'python') {
    return res.status(400).json({ error: 'Only Python execution is supported on server' });
  }

  try {
    // Use Pyodide or Python subprocess
    // For now, return mock response (implement actual execution later)
    // Note: This requires Python runtime or Pyodide
    res.status(501).json({
      error: 'Code execution not yet implemented',
      message: 'To enable Python execution, set up Pyodide or Python runtime on server',
      output: '',
      error: 'Execution service not configured',
    });
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ 
      error: error?.message || 'Code execution failed',
      output: '',
    });
  }
});

// Agentic Planning endpoint
app.post('/api/plan', async (req, res) => {
  const { prompt, provider = 'groq' } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Use AI to generate a plan with enhanced instructions
    const planningPrompt = `You are an expert project planning assistant. Your task is to break down the user's request into a detailed, actionable task list with clear dependencies, priorities, and time estimates.

User Request: "${prompt}"

INSTRUCTIONS:
1. Analyze the request thoroughly and identify all required components
2. Break down into logical, sequential tasks that can be executed independently when dependencies are met
3. Each task should be specific, actionable, and have clear deliverables
4. Identify dependencies carefully - tasks should only depend on completed tasks
5. Estimate time realistically in minutes (5-60 minutes per task typically)
6. Assign priorities based on critical path and importance
7. Categorize tasks appropriately

TASK CATEGORIES:
- setup: Initial configuration, dependencies, project structure
- component: UI components, React components, visual elements
- styling: CSS, Tailwind, design system, themes
- logic: Business logic, state management, algorithms
- integration: API calls, external services, data fetching
- testing: Unit tests, integration tests, e2e tests
- deployment: Build, deployment configuration, hosting
- documentation: Code comments, README, user guides

PRIORITIES:
- high: Critical path, blocking other tasks, core functionality
- medium: Important but not blocking, enhances functionality
- low: Nice-to-have, polish, optimizations

Create a JSON response with this EXACT structure:
{
  "tasks": [
    {
      "id": "1",
      "title": "Clear, concise task title (verb + noun)",
      "description": "Detailed description of what needs to be done, including specific requirements and acceptance criteria",
      "status": "pending",
      "dependencies": ["task_id_if_any"],
      "estimatedTime": 15,
      "priority": "high",
      "category": "setup"
    }
  ],
  "estimatedTotalTime": 45
}

IMPORTANT:
- Always return valid JSON
- IDs should be sequential strings ("1", "2", "3", etc.)
- Dependencies array should reference task IDs
- estimatedTime should be in minutes (integer)
- estimatedTotalTime should be the sum of all task times
- Be thorough but practical - typically 3-10 tasks depending on complexity
- Consider the full development lifecycle from setup to deployment`;

    const messages = [
      { role: 'system', content: planningPrompt },
      { role: 'user', content: prompt },
    ];

    let content = '';
    
    // Support grok provider for planning
    if (provider === 'openai' && openaiClient) {
      const completion = await openaiClient.chat.completions.create({
        model: MODELS.openai,
        messages,
        temperature: 0.7,
        max_tokens: 3000,
      });
      content = completion.choices[0]?.message?.content || '';
    } else if (provider === 'grok' && groqClient) {
      // Grok uses Groq SDK with Kimi K2 model
      // Use same temperature as other providers for consistency
      const completion = await groqClient.chat.completions.create({
        model: MODELS.grok,
        messages,
        temperature: 0.7, // Planning mode uses 0.7 for all providers
        max_tokens: 3000,
      });
      content = completion.choices[0]?.message?.content || '';
    } else if (groqClient) {
      // Default to Groq
      const completion = await groqClient.chat.completions.create({
        model: MODELS.groq,
        messages,
        temperature: 0.7,
        max_tokens: 3000,
      });
      content = completion.choices[0]?.message?.content || '';
    } else {
      throw new Error('No AI client available');
    }

    // Try to parse JSON from response
    let planData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : content;
      planData = JSON.parse(jsonContent.trim());
    } catch (parseError) {
      // If parsing fails, create a basic plan
      planData = {
        tasks: [
          {
            id: '1',
            title: 'Analyze Requirements',
            description: 'Understand the user requirements',
            status: 'pending',
            dependencies: [],
            priority: 'high',
            category: 'setup',
          },
          {
            id: '2',
            title: 'Generate Code',
            description: 'Create the application code',
            status: 'pending',
            dependencies: ['1'],
            priority: 'high',
            category: 'component',
          },
        ],
        estimatedTotalTime: 15,
      };
    }

    res.json({
      id: Date.now().toString(),
      prompt,
      tasks: planData.tasks || [],
      estimatedTotalTime: planData.estimatedTotalTime || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Planning error:', error);
    res.status(500).json({
      error: error?.message || 'Planning failed',
      id: Date.now().toString(),
      prompt,
      tasks: [],
      estimatedTotalTime: 0,
    });
  }
});

// Currency detection endpoint
app.get('/api/currency/detect', async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    
    // Try to detect from IP
    let countryCode = 'US';
    try {
      const response = await fetch(`https://ipapi.co/${clientIp}/json/`);
      if (response.ok) {
        const data = await response.json();
        countryCode = data.country_code || 'US';
      }
    } catch (error) {
      console.warn('Failed to detect IP location:', error);
    }

    const currency = countryCode === 'ID' ? 'IDR' : 'USD';
    const exchangeRate = countryCode === 'ID' ? 16000 : 1;
    
    res.json({
      currency,
      countryCode,
      exchangeRate,
    });
  } catch (error) {
    console.error('Currency detection error:', error);
    res.json({
      currency: 'USD',
      countryCode: 'US',
      exchangeRate: 1,
    });
  }
});

// Payment checkout endpoint
app.post('/api/payment/checkout', async (req, res) => {
  const { plan, currency, amount, userId } = req.body || {};

  if (!plan || plan !== 'premium') {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    // For IDR, use Xendit; for USD, use Stripe (or Xendit if supported)
    // This is a simplified version - integrate with actual payment providers
    const checkoutData = {
      plan: 'premium',
      amount,
      currency,
      checkout_url: `/payment/process?plan=premium&amount=${amount}&currency=${currency}&userId=${userId || 'anonymous'}`,
    };

    // TODO: Integrate with Xendit for IDR payments
    // TODO: Integrate with Stripe for USD payments
    
    res.json(checkoutData);
  } catch (error) {
    console.error('Payment checkout error:', error);
    res.status(500).json({
      error: error?.message || 'Payment checkout failed',
    });
  }
});

// Payment success callback
app.post('/api/payment/success', async (req, res) => {
  const { userId, plan } = req.body || {};

  if (!userId || !plan) {
    return res.status(400).json({ error: 'Missing userId or plan' });
  }

  try {
    // Update user subscription in database
    // This should be done via Supabase client
    // For now, return success - actual implementation should update user_preferences table
    res.json({
      success: true,
      message: 'Subscription activated',
    });
  } catch (error) {
    console.error('Payment success error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to activate subscription',
    });
  }
});

// Start server - Passenger will handle it automatically
app.listen(PORT, () => {
  console.log(`API proxy listening on ${PORT}`);
});
