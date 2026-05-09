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
  'philos': 'Noir Philos',
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
You are NOIR BUILDER, an elite Frontend Engineer/UX Architect. Your mission is to generate production-ready web applications.
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
  provider: AIProvider,
  userId?: string,
  images: string[] = []
): Promise<CodeResponse> {
  // Logic to include active skills prompt would go here in the actual implementation
  // For now, returning a mock response structure
  return {
    type: 'single-file',
    content: `Code generated with ${provider} for prompt: ${prompt}`
  };
}
