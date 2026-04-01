/**
 * Philos Memory Service
 * Manages persistent per-user memory for Noir Philos
 */

export class PhilosMemoryService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  // Save a memory fact about the user
  async saveMemory(userId, { content, type = 'fact', tags = [], importance = 5 }) {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('philos_memory')
      .insert({ user_id: userId, content, type, tags, importance })
      .select()
      .single();
    if (error) console.error('[Philos Memory] Save error:', error.message);
    return data;
  }

  // Get relevant memories for a given query (keyword match)
  async getRelevantMemories(userId, query, limit = 8) {
    if (!this.supabase) return [];
    try {
      const { data } = await this.supabase
        .from('philos_memory')
        .select('content, type, tags, importance')
        .eq('user_id', userId)
        .order('importance', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (!data || data.length === 0) return [];

      // Simple keyword relevance filter
      const lowerQuery = query.toLowerCase();
      const keywords = lowerQuery.split(/\s+/).filter(w => w.length > 3);

      const scored = data.map(m => {
        const lowerContent = m.content.toLowerCase();
        const score = keywords.reduce((acc, kw) => acc + (lowerContent.includes(kw) ? 1 : 0), 0);
        return { ...m, score };
      });

      return scored
        .sort((a, b) => b.score - a.score || b.importance - a.importance)
        .slice(0, limit)
        .map(m => m.content);
    } catch (e) {
      console.error('[Philos Memory] Query error:', e.message);
      return [];
    }
  }

  // Get all memories for a user
  async getAllMemories(userId) {
    if (!this.supabase) return [];
    const { data } = await this.supabase
      .from('philos_memory')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data || [];
  }

  // Delete a memory entry
  async deleteMemory(userId, memoryId) {
    if (!this.supabase) return;
    await this.supabase
      .from('philos_memory')
      .delete()
      .eq('id', memoryId)
      .eq('user_id', userId);
  }

  // Get or create user profile
  async getProfile(userId) {
    if (!this.supabase) return null;
    const { data } = await this.supabase
      .from('philos_profile')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return data;
  }

  // Update user profile
  async updateProfile(userId, updates) {
    if (!this.supabase) return null;
    const { data } = await this.supabase
      .from('philos_profile')
      .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();
    return data;
  }

  // Build dynamic system prompt with user context
  async buildSystemPrompt(userId, userMessage) {
    const profile = await this.getProfile(userId);
    const memories = await this.getRelevantMemories(userId, userMessage, 6);

    const name = profile?.name || 'there';
    const occupation = profile?.occupation ? `, a ${profile.occupation}` : '';
    const tone = profile?.tone || 'friendly';
    const language = profile?.language || 'id';
    const projects = profile?.current_projects?.length
      ? `\nCurrent projects: ${profile.current_projects.join(', ')}`
      : '';
    const goals = profile?.goals?.length
      ? `\nGoals: ${profile.goals.join(', ')}`
      : '';
    const memoryContext = memories.length
      ? `\n\nWhat I remember about you:\n${memories.map(m => `- ${m}`).join('\n')}`
      : '';

    const toneGuide = {
      friendly: 'warm, supportive, and conversational — like a trusted friend who happens to be brilliant',
      professional: 'precise, structured, and professional — like a senior consultant',
      casual: 'relaxed and casual — like a smart friend you can talk to about anything',
    }[tone] || 'warm and helpful';

    return `You are Philos, the personal AI companion of ${name}${occupation}. You are part of the Noir AI platform.

Your personality: ${toneGuide}. You are thoughtful, proactive, and genuinely care about ${name}'s success. You remember context across conversations and use it naturally — never robotically.

About ${name}:${projects}${goals}${memoryContext}

Language: Respond in ${language === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English'} unless the user writes in a different language.

Key behaviors:
- Address the user by name naturally (not every message, just when it feels right)
- Reference past context when relevant, but don't force it
- Be proactive: if you notice something important, mention it
- When the user shares new information about themselves, acknowledge it naturally
- You have access to the user's connected apps (Gmail, GitHub, etc.) when they've authorized them
- Keep responses concise unless depth is needed`;
  }
}

/**
 * Automates memory extraction from AI response
 */
export async function extractAndSaveMemories(userId, userMsg, aiResponse, memoryService) {
  if (!memoryService.supabase) return;

  try {
    const extractionPrompt = `[MEMORIZER]
Extract only IMPORTANT new facts about the user from this conversation.
Ignore technical troubleshooting or generic questions. Focus on: name, interests, work, goals, preferences.

USER: "${userMsg}"
PHILOS: "${aiResponse.substring(0, 500)}..."

Return exactly 1-3 short JSON objects if found, or empty array [].
Example: [{"content": "Likes dark mode", "tags": ["preference"]}]`;

    // Use a fast model for extraction
    const { data } = await memoryService.supabase.functions.invoke('ai-proxy', {
        body: { 
            model: 'seed-2-0-pro-free', // or a faster one
            messages: [{ role: 'system', content: extractionPrompt }]
        }
    });

    if (data && Array.isArray(data)) {
        for (const fact of data) {
            await memoryService.saveMemory(userId, fact);
        }
    }
  } catch (e) {
    console.warn('[Philos] Memory extraction failed:', e.message);
  }
}
