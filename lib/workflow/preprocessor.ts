import { PreprocessedInput, Message, Framework } from './types';
import { WORKFLOW_CONFIG } from './config';

/**
 * Preprocess user input to extract intent, context, and metadata
 */
export function preprocessInput(
  prompt: string,
  history: Message[],
  images?: string[],
  framework?: Framework
): PreprocessedInput {
  // Clean and normalize input
  const cleanedPrompt = prompt
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');

  // Detect intent
  const intent = detectIntent(cleanedPrompt, history);

  // Analyze context
  const hasCode = history.some(msg => 
    msg.role === 'ai' && msg.code && msg.code.trim().length > 0
  );

  const hasImages = (images && images.length > 0) || 
    history.some(msg => msg.images && msg.images.length > 0);

  // Determine complexity
  const complexity = determineComplexity(cleanedPrompt, hasCode, hasImages);

  // Extract metadata
  const metadata = extractMetadata(cleanedPrompt, history, framework);

  return {
    cleanedPrompt,
    intent,
    context: {
      hasCode,
      hasImages,
      framework: framework || detectFramework(cleanedPrompt, history),
      complexity,
    },
    metadata,
  };
}

/**
 * Detect user intent from prompt
 */
function detectIntent(prompt: string, history: Message[]): PreprocessedInput['intent'] {
  const lowerPrompt = prompt.toLowerCase();

  // Question patterns
  const questionPatterns = [
    /^(apa|what|how|why|when|where|who|which|can|could|should|would|is|are|do|does|did|will|was|were)\s+/i,
    /\?$/,
    /^(tolong|please)\s+(jelaskan|explain|terangkan|bantu|help)/i,
    /^(apa itu|what is|apa artinya|what does|bagaimana|how)/i,
  ];

  if (questionPatterns.some(pattern => pattern.test(lowerPrompt))) {
    return 'question';
  }

  // Edit patterns
  const editPatterns = [
    /^(ubah|edit|ganti|modify|change|update|tambah|add|hapus|remove|delete|make it|make the)/i,
    /^(ubah|ganti|buat|change)\s+(warna|color|style|desain|layout|background|font)/i,
    /(warna|color)\s+(kuning|yellow|merah|red|biru|blue|hijau|green|putih|white|hitam|black)/i,
  ];

  if (editPatterns.some(pattern => pattern.test(lowerPrompt))) {
    return 'edit';
  }

  // Explanation patterns
  const explanationPatterns = [
    /^(jelaskan|explain|terangkan|describe|tell me about)/i,
    /^(bagaimana cara|how to|how does|how can)/i,
  ];

  if (explanationPatterns.some(pattern => pattern.test(lowerPrompt))) {
    return 'explanation';
  }

  // Check if there's existing code in history (likely edit request)
  const hasCode = history.some(msg => 
    msg.role === 'ai' && msg.code && msg.code.trim().length > 0
  );

  if (hasCode && !lowerPrompt.includes('?')) {
    return 'edit';
  }

  // Default to code generation
  return 'code_generation';
}

/**
 * Determine request complexity
 */
function determineComplexity(
  prompt: string,
  hasCode: boolean,
  hasImages: boolean
): 'simple' | 'medium' | 'complex' {
  const length = prompt.length;
  const wordCount = prompt.split(/\s+/).length;

  // Simple: short prompts, greetings, simple questions
  if (
    length < WORKFLOW_CONFIG.simpleRequestMaxLength ||
    WORKFLOW_CONFIG.simpleRequestKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    ) ||
    (wordCount < 10 && !hasCode && !hasImages)
  ) {
    return 'simple';
  }

  // Complex: long prompts, multiple requirements, code + images
  if (
    length > 500 ||
    wordCount > 100 ||
    (hasCode && hasImages) ||
    prompt.includes('dan') && prompt.split('dan').length > 3 ||
    /(create|buat|build|generate).*(with|dengan|and|dan).*(and|dan)/i.test(prompt)
  ) {
    return 'complex';
  }

  // Medium: everything else
  return 'medium';
}

/**
 * Extract metadata from prompt and history
 */
function extractMetadata(
  prompt: string,
  history: Message[],
  framework?: Framework
): Record<string, any> {
  const metadata: Record<string, any> = {};

  // Framework hints
  const frameworkHints: Record<string, Framework> = {
    'next.js': 'nextjs',
    'nextjs': 'nextjs',
    'next': 'nextjs',
    'react': 'react',
    'vite': 'vite',
    'html': 'html',
  };

  for (const [hint, fw] of Object.entries(frameworkHints)) {
    if (prompt.toLowerCase().includes(hint)) {
      metadata.frameworkHint = fw;
      break;
    }
  }

  // Style preferences
  const styleKeywords = {
    minimal: ['minimal', 'simple', 'clean', 'minimalis'],
    modern: ['modern', 'contemporary', 'trendy'],
    glassmorphism: ['glassmorphism', 'glass', 'frosted'],
    gradient: ['gradient', 'gradien'],
    dark: ['dark', 'dark mode', 'hitam'],
    light: ['light', 'light mode', 'putih'],
  };

  for (const [style, keywords] of Object.entries(styleKeywords)) {
    if (keywords.some(keyword => prompt.toLowerCase().includes(keyword))) {
      metadata.stylePreference = style;
      break;
    }
  }

  // Color preferences
  const colorMatch = prompt.match(/(warna|color)\s+(\w+)/i);
  if (colorMatch) {
    metadata.colorPreference = colorMatch[2];
  }

  // Component hints
  const componentHints = ['button', 'form', 'card', 'modal', 'navbar', 'footer', 'hero'];
  const foundComponents = componentHints.filter(comp => 
    prompt.toLowerCase().includes(comp)
  );
  if (foundComponents.length > 0) {
    metadata.components = foundComponents;
  }

  // Language detection
  const hasIndonesian = /[a-z]+\s+(yang|dengan|untuk|dari|pada|adalah|akan|sudah|belum)/i.test(prompt);
  metadata.language = hasIndonesian ? 'id' : 'en';

  return metadata;
}

/**
 * Detect framework from prompt and history
 */
function detectFramework(prompt: string, history: Message[]): Framework | undefined {
  const lowerPrompt = prompt.toLowerCase();

  // Check prompt for framework mentions
  if (lowerPrompt.includes('next.js') || lowerPrompt.includes('nextjs') || lowerPrompt.includes('next ')) {
    return 'nextjs';
  }
  if (lowerPrompt.includes('vite')) {
    return 'vite';
  }
  if (lowerPrompt.includes('react')) {
    return 'react';
  }

  // Check history for framework context
  for (const msg of history.slice().reverse()) {
    if (msg.code) {
      if (msg.code.includes('next.config') || msg.code.includes('Next.js')) {
        return 'nextjs';
      }
      if (msg.code.includes('vite.config') || msg.code.includes('import.meta')) {
        return 'vite';
      }
      if (msg.code.includes('React') || msg.code.includes('react')) {
        return 'react';
      }
    }
  }

  return undefined;
}
