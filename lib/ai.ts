import { getSkills } from './skillsApi';

/** Canonical provider aliases plus OpenRouter `org/model:id` slugs allowed for routing. */
export type AIProvider =
  | 'groq'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'qwen-free'
  | 'philos'
  | 'nemotron-free'
  | 'nemotron-nano-free'
  | 'minimax-free'
  | 'glm-free'
  | 'qwen-coder-free'
  | 'gemma-free'
  | 'gpt-oss-free'
  | 'hermes-free'
  | 'openrouter-free'
  | 'tencent/hy3-preview:free'
  | 'nvidia/nemotron-3-super-120b-a12b:free'
  | 'google/gemma-4-31b-it:free'
  | 'openai/gpt-oss-120b:free'
  | 'inclusionai/ling-2.6-1t:free'
  | 'z-ai/glm-4.5-air:free';

export type Framework = 'html' | 'react' | 'vite' | 'nextjs';

/** Free-tier models (OpenRouter slugs exposed in UI). */
export const FREE_TIER_MODELS: AIProvider[] = [
  'tencent/hy3-preview:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-120b:free',
  'inclusionai/ling-2.6-1t:free',
  'z-ai/glm-4.5-air:free',
];

export const PRO_ONLY_MODELS: AIProvider[] = ['openai', 'anthropic', 'gemini'];

// Model display names for UI
export const MODEL_DISPLAY_NAMES: Record<AIProvider, string> = {
  'groq': 'SumoPod (Default)',
  'openai': 'OpenAI GPT-5',
  'anthropic': 'Claude Sonnet',
  'gemini': 'Gemini Pro',
  'qwen-free': 'Qwen 3.6 Plus',
  'philos': 'Glass Philos',
  'nemotron-free': 'Nemotron 3 Super 120B',
  'nemotron-nano-free': 'Nemotron 3 Nano 30B',
  'minimax-free': 'MiniMax M2.5',
  'glm-free': 'GLM 4.5 Air',
  'qwen-coder-free': 'Qwen3 Coder 480B',
  'gemma-free': 'Gemma 3 27B',
  'gpt-oss-free': 'gpt-oss 120B',
  'hermes-free': 'Hermes 3 405B',
  'openrouter-free': 'OpenRouter Free',
  'tencent/hy3-preview:free': 'Tencent HY3 Preview',
  'nvidia/nemotron-3-super-120b-a12b:free': 'Nemotron 3 Super 120B',
  'google/gemma-4-31b-it:free': 'Gemma 4 31B',
  'openai/gpt-oss-120b:free': 'GPT-OSS 120B',
  'inclusionai/ling-2.6-1t:free': 'Ling 2.6 1T',
  'z-ai/glm-4.5-air:free': 'GLM 4.5 Air',
};

/** Readable label for any model id (OpenRouter slug or legacy alias). */
export function getModelDisplayName(modelId: string): string {
  const map = MODEL_DISPLAY_NAMES as Record<string, string>;
  return map[modelId] ?? modelId;
}

// Check if a model is allowed for a given tier
export const isModelAllowed = (provider: AIProvider, tier: 'free' | 'pro'): boolean => {
  if (tier === 'pro') return true;
  return FREE_TIER_MODELS.includes(provider);
};

// Get allowed models for tier
export const getModelsForTier = (tier: 'free' | 'pro'): AIProvider[] => {
  if (tier === 'pro') {
    return [...FREE_TIER_MODELS, ...PRO_ONLY_MODELS];
  }
  return FREE_TIER_MODELS;
};

// Check if model requires Pro subscription
export const isProOnlyModel = (provider: AIProvider): boolean => {
  return PRO_ONLY_MODELS.includes(provider);
};

// --- ENHANCED SYSTEM PROMPTS (Bolt.new / v0.app Level) ---
export const BUILDER_PROMPT = `
You are GLASS BUILDER, an elite Frontend Engineer/UX Architect. Your mission is to generate production-ready web applications.
`;

/**
 * Get active skills for a user and format them as a system prompt addition
 */
export async function getActiveSkillsPrompt(userId: string): Promise<string> {
  try {
    const skills = await getSkills(userId);
    const activeSkills = skills.filter(s => s.enabled);
    if (activeSkills.length === 0) return '';

    return `\n\n[USER SKILLS ENABLED]:\n${activeSkills.map(s => `- ${s.name}: ${s.system_prompt}`).join('\n')}\n`;
  } catch (error) {
    return '';
  }
}

export interface CodeResponse {
  type: 'single-file' | 'multi-file';
  content?: string;
  files?: Array<{ path: string; content: string; type: string }>;
  entry?: string;
  framework?: string;
}

export async function generateCode(
  prompt: string,
  historyOrProvider: any = [],
  modeOrUserId: any = 'builder',
  providerOrImages: any = 'groq',
  imagesArg: string[] = [],
  framework: Framework | string = 'react',
  _workflowOptions?: any,
  _onChunk?: (chunk: string) => void,
  sessionId?: string,
  userId?: string,
  userName?: string,
  userEmail?: string,
  tier?: 'free' | 'pro',
  deepDive?: boolean,
  selectedModel?: string,
  signal?: AbortSignal,
  extraSystemPrompt?: string
): Promise<CodeResponse> {
  const legacyCall = !Array.isArray(historyOrProvider);
  const history = legacyCall ? [] : historyOrProvider;
  const mode = legacyCall ? 'builder' : (modeOrUserId || 'builder');
  const provider = legacyCall ? historyOrProvider : (providerOrImages || 'groq');
  const images = legacyCall ? (providerOrImages || []) : (imagesArg || []);
  const effectiveUserId = legacyCall ? modeOrUserId : userId;

  const baseSystemPrompt = mode === 'builder'
    ? `${BUILDER_PROMPT}

You are Glass Builder inside UseGlass AI. Generate production-ready UI/code, prefer clean white glassmorphism, responsive layouts, accessible controls, and concise implementation notes when returning code.`
    : `You are UseGlass AI, an intelligent glass workspace assistant.

Modes supported: fast answer, Glass Thinking, creative writing, coding assistant, academic research, document understanding, and lightweight answers.
Use Markdown, code blocks, tables, math, and citations when helpful. Keep answers clear, structured, and useful.`;

  // Skill / style / workflow instruction (composed by ChatInterface) is
  // prepended at SYSTEM level so the AI starts in the skill's voice rather
  // than receiving it as user-message context (weaker signal).
  const systemPrompt = extraSystemPrompt
    ? `${extraSystemPrompt}\n\n${baseSystemPrompt}`
    : baseSystemPrompt;

  // Retry transient upstream failures (503/504) up to 2 times with backoff.
  // 9Router / OpenRouter occasionally returns 503 during cold starts or
  // upstream provider hiccups — a quick retry usually succeeds.
  // Use SSE streaming when the caller passes _onChunk so tokens render live.
  const wantStream = typeof _onChunk === 'function';
  let response: Response | null = null;
  let lastError: any = null;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(wantStream ? { Accept: 'text/event-stream' } : {}),
        },
        signal,
        body: JSON.stringify({
          prompt,
          history,
          mode,
          provider,
          images,
          framework,
          systemPrompt,
          sessionId,
          userId: effectiveUserId,
          userName,
          userEmail,
          tier,
          deepDive,
          model: selectedModel,
          glassMode: mode,
          planningEnabled: deepDive,
          stream: wantStream,
        }),
      });
      if (response.status === 503 || response.status === 504) {
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
          continue;
        }
      }
      break;
    } catch (err: any) {
      lastError = err;
      if (err?.name === 'AbortError') throw err; // user cancelled — bail
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        continue;
      }
      throw err;
    }
  }
  if (!response) throw lastError || new Error('No response from /api/generate');

  const contentType = response.headers.get('content-type') || '';

  // SSE streaming branch — read deltas, fire onChunk per token, return
  // assembled content at the end. Server falls back to JSON when streaming
  // isn't available, in which case we drop into the legacy path below.
  if (wantStream && response.ok && contentType.includes('text/event-stream') && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assembled = '';
    let streamErr: string | null = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';
      for (const evt of events) {
        const lines = evt.split('\n');
        let eventName = 'message';
        let dataLine = '';
        for (const line of lines) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          else if (line.startsWith('data:')) dataLine = line.slice(5).trim();
        }
        if (!dataLine || dataLine === '[DONE]') continue;
        try {
          const payload = JSON.parse(dataLine);
          if (eventName === 'delta' && typeof payload.content === 'string') {
            assembled += payload.content;
            try { _onChunk?.(payload.content); } catch {}
          } else if (eventName === 'error') {
            streamErr = payload.message || payload.error || 'stream error';
          }
        } catch {
          // ignore malformed event
        }
      }
    }
    if (streamErr) throw new Error(streamErr);
    return {
      type: 'single-file',
      content: assembled,
      framework: String(framework || 'react'),
    };
  }

  const data = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : { error: await response.text().catch(() => response.statusText) };

  if (!response.ok) {
    const setupHint = data?.setup?.required ? ` Required env: ${data.setup.required.join(', ')}.` : '';
    throw new Error(data?.message || data?.error || `${response.status} ${response.statusText}${setupHint}`);
  }

  const content = data?.content ?? '';

  if (typeof content === 'object' && content?.type) {
    return content as CodeResponse;
  }

  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed?.type) return parsed as CodeResponse;
      } catch {
        // Use raw content below.
      }
    }
    return {
      type: 'single-file',
      content,
      framework: String(framework || 'react'),
    };
  }

  return {
    type: 'single-file',
    content: '',
    framework: String(framework || 'react'),
  };
}
