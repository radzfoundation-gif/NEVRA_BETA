// Database removed - using stub functions
import { IntentAnalysis } from '../analyzers/IntentAnalyzer';
import { Message } from '../types';

// Stub types (Supabase removed)
interface UserPreferences {
  default_provider?: string;
  theme?: string;
  preferences?: Record<string, any>;
}

interface StubUser {
  id: string;
  full_name: string | null;
  email: string | null;
}

// Stub functions
import { getUser, getUserPreferences } from '../../firebaseDatabase';


/**
 * User Profile Engine
 * Manages user preferences, history, and personalization
 */
export interface UserProfile {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  preferences: UserPreferences | null;
  history: {
    totalMessages: number;
    commonIntents: Record<string, number>;
    preferredFramework?: string;
    preferredStyle?: string;
    averageComplexity: 'simple' | 'medium' | 'complex';
  };
  behavior: {
    responseTime: number;
    detailLevel: 'brief' | 'normal' | 'detailed';
    prefersCode: boolean;
    prefersExplanations: boolean;
  };
}

export class UserProfileEngine {
  /**
   * Load user profile
   */
  static async loadProfile(
    userId: string | undefined,
    history: Message[]
  ): Promise<UserProfile | null> {
    if (!userId) {
      return null;
    }

    try {
      const user = await getUser(userId);
      const preferences = await getUserPreferences(userId);
      const historyAnalysis = this.analyzeHistory(history);
      const behavior = this.inferBehavior(history, preferences);

      return {
        userId,
        userName: user?.fullName || null,
        userEmail: user?.email || null,
        preferences,
        history: historyAnalysis,
        behavior,
      };
    } catch (error) {
      console.error('UserProfileEngine: Error loading profile', error);
      return null;
    }
  }

  /**
   * Analyze user history
   */
  private static analyzeHistory(history: Message[]): UserProfile['history'] {
    const totalMessages = history.length;
    const commonIntents: Record<string, number> = {};
    const frameworks: Record<string, number> = {};
    const styles: Record<string, number> = {};
    const complexities: Array<'simple' | 'medium' | 'complex'> = [];

    history.forEach(msg => {
      if (msg.role === 'user') {
        const text = msg.content.toLowerCase();
        if (/(buat|create|generate|build)/i.test(text)) {
          commonIntents['code_generation'] = (commonIntents['code_generation'] || 0) + 1;
        }
        if (/(jelaskan|explain|how|what|why)/i.test(text)) {
          commonIntents['explanation'] = (commonIntents['explanation'] || 0) + 1;
        }
        if (/(ubah|edit|change|modify)/i.test(text)) {
          commonIntents['edit'] = (commonIntents['edit'] || 0) + 1;
        }

        if (/react/i.test(text)) frameworks['react'] = (frameworks['react'] || 0) + 1;
        if (/next/i.test(text)) frameworks['nextjs'] = (frameworks['nextjs'] || 0) + 1;
        if (/vite/i.test(text)) frameworks['vite'] = (frameworks['vite'] || 0) + 1;

        if (/(minimal|simple|clean)/i.test(text)) styles['minimal'] = (styles['minimal'] || 0) + 1;
        if (/(modern|contemporary)/i.test(text)) styles['modern'] = (styles['modern'] || 0) + 1;
        if (/(dark|hitam)/i.test(text)) styles['dark'] = (styles['dark'] || 0) + 1;

        const wordCount = text.split(/\s+/).length;
        if (wordCount < 20) complexities.push('simple');
        else if (wordCount < 100) complexities.push('medium');
        else complexities.push('complex');
      }
    });

    const preferredFramework = Object.entries(frameworks)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    const preferredStyle = Object.entries(styles)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    const avgComplexity = complexities.length > 0
      ? complexities.reduce((acc, c) => {
        if (c === 'simple') return acc + 1;
        if (c === 'medium') return acc + 2;
        return acc + 3;
      }, 0) / complexities.length
      : 2;

    const averageComplexity: 'simple' | 'medium' | 'complex' =
      avgComplexity < 1.5 ? 'simple' : avgComplexity < 2.5 ? 'medium' : 'complex';

    return {
      totalMessages,
      commonIntents,
      preferredFramework: preferredFramework as any,
      preferredStyle,
      averageComplexity,
    };
  }

  /**
   * Infer user behavior
   */
  private static inferBehavior(
    history: Message[],
    preferences: UserPreferences | null
  ): UserProfile['behavior'] {
    const aiMessages = history.filter(msg => msg.role === 'ai');
    const hasCode = aiMessages.some(msg => msg.code && msg.code.length > 0);
    const hasExplanations = aiMessages.some(msg =>
      msg.content && msg.content.length > 100 && !msg.code
    );

    const avgLength = aiMessages.reduce((sum, msg) =>
      sum + (msg.content?.length || 0), 0
    ) / (aiMessages.length || 1);

    let detailLevel: 'brief' | 'normal' | 'detailed' = 'normal';
    if (avgLength < 200) detailLevel = 'brief';
    else if (avgLength > 1000) detailLevel = 'detailed';

    return {
      responseTime: 0,
      detailLevel,
      prefersCode: hasCode && aiMessages.filter(msg => msg.code).length > aiMessages.length / 2,
      prefersExplanations: hasExplanations && !hasCode,
    };
  }

  /**
   * Get personalized context for workflow
   */
  static getPersonalizedContext(
    profile: UserProfile | null,
    intentAnalysis: IntentAnalysis
  ): Record<string, any> {
    if (!profile) {
      return {};
    }

    const context: Record<string, any> = {};

    if (!intentAnalysis.requirements.framework && profile.history.preferredFramework) {
      context.framework = profile.history.preferredFramework;
    }

    if (!intentAnalysis.requirements.style && profile.history.preferredStyle) {
      context.style = profile.history.preferredStyle;
    }

    if (profile.behavior.detailLevel === 'brief') {
      context.briefMode = true;
    } else if (profile.behavior.detailLevel === 'detailed') {
      context.detailedMode = true;
    }

    if (profile.preferences) {
      context.defaultProvider = profile.preferences.default_provider;
      context.theme = profile.preferences.theme;
      if (profile.preferences.preferences) {
        Object.assign(context, profile.preferences.preferences);
      }
    }

    return context;
  }
}
