import { NormalizedInput } from '../normalizers/InputNormalizer';
import { Message } from '../types';

/**
 * Intent Analyzer
 * Advanced intent detection and analysis
 */
export interface IntentAnalysis {
  primaryIntent: 'code_generation' | 'question' | 'edit' | 'explanation' | 'debug' | 'refactor' | 'test';
  confidence: number; // 0-1
  secondaryIntents: Array<{ intent: string; confidence: number }>;
  context: {
    hasCode: boolean;
    hasImages: boolean;
    hasErrors: boolean;
    isFollowUp: boolean;
  };
  requirements: {
    framework?: string;
    components?: string[];
    features?: string[];
    style?: string;
  };
}

export class IntentAnalyzer {
  /**
   * Analyze intent from normalized input
   */
  static analyze(
    normalized: NormalizedInput,
    history: Message[],
    framework?: string
  ): IntentAnalysis {
    const primaryIntent = this.detectPrimaryIntent(normalized, history);
    const confidence = this.calculateConfidence(normalized, primaryIntent);
    const secondaryIntents = this.detectSecondaryIntents(normalized);
    const context = this.analyzeContext(normalized, history);
    const requirements = this.extractRequirements(normalized, framework);

    return {
      primaryIntent,
      confidence,
      secondaryIntents,
      context,
      requirements,
    };
  }

  /**
   * Detect primary intent
   */
  private static detectPrimaryIntent(
    normalized: NormalizedInput,
    history: Message[]
  ): IntentAnalysis['primaryIntent'] {
    const text = normalized.normalized.toLowerCase();
    const hasCode = normalized.hasCodeBlocks || history.some(msg => msg.code);
    const hasQuestions = normalized.metadata.questions.length > 0;

    // Debug intent
    if (
      /(error|bug|fix|debug|masalah|salah|tidak bekerja|not working|broken)/i.test(text) ||
      (hasCode && /(kenapa|why|what.*wrong|how.*fix)/i.test(text))
    ) {
      return 'debug';
    }

    // Test intent
    if (
      /(test|testing|unit test|integration test|e2e|spec)/i.test(text) ||
      /(buat|create|write).*test/i.test(text)
    ) {
      return 'test';
    }

    // Refactor intent
    if (
      /(refactor|refactoring|improve|optimize|clean|cleanup|restructure)/i.test(text) ||
      (hasCode && /(perbaiki|make.*better|enhance)/i.test(text))
    ) {
      return 'refactor';
    }

    // Question intent
    if (
      hasQuestions ||
      /^(apa|what|how|why|when|where|who|which|can|could|should|would|is|are|do|does|did|will|was|were)\s+/i.test(text) ||
      /^(tolong|please)\s+(jelaskan|explain|terangkan|bantu|help)/i.test(text) ||
      /^(apa itu|what is|apa artinya|what does|bagaimana|how)/i.test(text)
    ) {
      return 'question';
    }

    // Explanation intent
    if (
      /^(jelaskan|explain|terangkan|describe|tell me about)/i.test(text) ||
      /^(bagaimana cara|how to|how does|how can)/i.test(text)
    ) {
      return 'explanation';
    }

    // Edit intent
    if (
      /^(ubah|edit|ganti|modify|change|update|tambah|add|hapus|remove|delete|make it|make the)/i.test(text) ||
      /^(ubah|ganti|buat|change)\s+(warna|color|style|desain|layout|background|font)/i.test(text) ||
      (hasCode && !normalized.metadata.questions.length)
    ) {
      return 'edit';
    }

    // Default: code generation
    return 'code_generation';
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(
    normalized: NormalizedInput,
    intent: IntentAnalysis['primaryIntent']
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on clear indicators
    const text = normalized.normalized.toLowerCase();

    switch (intent) {
      case 'debug':
        if (/(error|bug|fix|broken)/i.test(text)) confidence += 0.3;
        if (normalized.hasCodeBlocks) confidence += 0.2;
        break;
      case 'test':
        if (/test/i.test(text)) confidence += 0.4;
        break;
      case 'refactor':
        if (/(refactor|optimize|improve)/i.test(text)) confidence += 0.3;
        if (normalized.hasCodeBlocks) confidence += 0.2;
        break;
      case 'question':
        if (normalized.metadata.questions.length > 0) confidence += 0.3;
        if (/\?/.test(text)) confidence += 0.2;
        break;
      case 'explanation':
        if (/(jelaskan|explain|how to)/i.test(text)) confidence += 0.4;
        break;
      case 'edit':
        if (/(ubah|edit|change|modify)/i.test(text)) confidence += 0.3;
        if (normalized.hasCodeBlocks) confidence += 0.2;
        break;
      case 'code_generation':
        if (/(buat|create|generate|build|make)/i.test(text)) confidence += 0.3;
        if (!normalized.metadata.questions.length) confidence += 0.2;
        break;
    }

    // Increase confidence if word count is reasonable (not too short, not too long)
    if (normalized.wordCount >= 5 && normalized.wordCount <= 200) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  /**
   * Detect secondary intents
   */
  private static detectSecondaryIntents(
    normalized: NormalizedInput
  ): Array<{ intent: string; confidence: number }> {
    const intents: Array<{ intent: string; confidence: number }> = [];
    const text = normalized.normalized.toLowerCase();

    // Check for multiple intents
    if (/(dan|and|also|plus)/i.test(text)) {
      if (/(test|testing)/i.test(text)) {
        intents.push({ intent: 'test', confidence: 0.3 });
      }
      if (/(optimize|improve|refactor)/i.test(text)) {
        intents.push({ intent: 'refactor', confidence: 0.3 });
      }
    }

    return intents;
  }

  /**
   * Analyze context
   */
  private static analyzeContext(
    normalized: NormalizedInput,
    history: Message[]
  ): IntentAnalysis['context'] {
    const hasCode = normalized.hasCodeBlocks || 
      history.some(msg => msg.role === 'ai' && msg.code && msg.code.trim().length > 0);
    
    const hasImages = normalized.hasImages || 
      history.some(msg => msg.images && msg.images.length > 0);

    const hasErrors = /(error|bug|exception|failed|fail|salah|tidak bekerja)/i.test(normalized.normalized);

    const isFollowUp = history.length > 0 && 
      history[history.length - 1].role === 'ai';

    return {
      hasCode,
      hasImages,
      hasErrors,
      isFollowUp,
    };
  }

  /**
   * Extract requirements
   */
  private static extractRequirements(
    normalized: NormalizedInput,
    framework?: string
  ): IntentAnalysis['requirements'] {
    const text = normalized.normalized.toLowerCase();
    const requirements: IntentAnalysis['requirements'] = {};

    // Framework detection
    const frameworkHints: Record<string, string> = {
      'next.js': 'nextjs',
      'nextjs': 'nextjs',
      'next': 'nextjs',
      'react': 'react',
      'vite': 'vite',
      'html': 'html',
    };

    for (const [hint, fw] of Object.entries(frameworkHints)) {
      if (text.includes(hint)) {
        requirements.framework = fw;
        break;
      }
    }

    if (framework && !requirements.framework) {
      requirements.framework = framework;
    }

    // Component detection
    const componentHints = ['button', 'form', 'card', 'modal', 'navbar', 'footer', 'hero', 'sidebar', 'dropdown', 'table'];
    const foundComponents = componentHints.filter(comp => text.includes(comp));
    if (foundComponents.length > 0) {
      requirements.components = foundComponents;
    }

    // Feature detection
    const featureHints = ['auth', 'authentication', 'login', 'signup', 'payment', 'stripe', 'database', 'api', 'crud'];
    const foundFeatures = featureHints.filter(feat => text.includes(feat));
    if (foundFeatures.length > 0) {
      requirements.features = foundFeatures;
    }

    // Style detection
    const styleHints = {
      minimal: ['minimal', 'simple', 'clean'],
      modern: ['modern', 'contemporary', 'trendy'],
      glassmorphism: ['glassmorphism', 'glass', 'frosted'],
      gradient: ['gradient', 'gradien'],
      dark: ['dark', 'dark mode'],
      light: ['light', 'light mode'],
    };

    for (const [style, keywords] of Object.entries(styleHints)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        requirements.style = style;
        break;
      }
    }

    return requirements;
  }
}
