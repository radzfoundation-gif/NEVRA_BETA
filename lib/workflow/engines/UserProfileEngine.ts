import { getUserPreferences, UserPreferences, getUser } from '../../database';
import { IntentAnalysis } from '../analyzers/IntentAnalyzer';
import { Message } from '../types';

/**
 * User Profile Engine
 * Manages user preferences, history, and personalization
 */
export interface UserProfile {
  userId: string;
  userName: string | null; // User's name for personalization
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
    responseTime: number; // Average response time preference
    detailLevel: 'brief' | 'normal' | 'detailed';
    prefersCode: boolean;
    prefersExplanations: boolean;
  };
}

export class UserProfileEngine {
  /**
   * Load user profile with name
   */
  static async loadProfile(
    userId: string | undefined,
    history: Message[]
  ): Promise<UserProfile | null> {
    if (!userId) {
      return null;
    }

    try {
      // Load user information (including name)
      const user = await getUser(userId);
      
      // Load preferences from database
      const preferences = await getUserPreferences(userId);

      // Analyze history
      const historyAnalysis = this.analyzeHistory(history);

      // Infer behavior from history
      const behavior = this.inferBehavior(history, preferences);

      return {
        userId,
        userName: user?.full_name || null,
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

    // Analyze messages
    history.forEach(msg => {
      if (msg.role === 'user') {
        // Count intents (simplified - would need full intent analysis)
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

        // Detect framework preferences
        if (/react/i.test(text)) frameworks['react'] = (frameworks['react'] || 0) + 1;
        if (/next/i.test(text)) frameworks['nextjs'] = (frameworks['nextjs'] || 0) + 1;
        if (/vite/i.test(text)) frameworks['vite'] = (frameworks['vite'] || 0) + 1;

        // Detect style preferences
        if (/(minimal|simple|clean)/i.test(text)) styles['minimal'] = (styles['minimal'] || 0) + 1;
        if (/(modern|contemporary)/i.test(text)) styles['modern'] = (styles['modern'] || 0) + 1;
        if (/(dark|hitam)/i.test(text)) styles['dark'] = (styles['dark'] || 0) + 1;

        // Estimate complexity
        const wordCount = text.split(/\s+/).length;
        if (wordCount < 20) complexities.push('simple');
        else if (wordCount < 100) complexities.push('medium');
        else complexities.push('complex');
      }
    });

    // Determine preferred framework
    const preferredFramework = Object.entries(frameworks)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    // Determine preferred style
    const preferredStyle = Object.entries(styles)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    // Calculate average complexity
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

    // Infer detail level from message lengths
    const avgLength = aiMessages.reduce((sum, msg) => 
      sum + (msg.content?.length || 0), 0
    ) / (aiMessages.length || 1);

    let detailLevel: 'brief' | 'normal' | 'detailed' = 'normal';
    if (avgLength < 200) detailLevel = 'brief';
    else if (avgLength > 1000) detailLevel = 'detailed';

    return {
      responseTime: 0, // Would need to track actual response times
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

    // Use preferred framework if not specified
    if (!intentAnalysis.requirements.framework && profile.history.preferredFramework) {
      context.framework = profile.history.preferredFramework;
    }

    // Use preferred style if not specified
    if (!intentAnalysis.requirements.style && profile.history.preferredStyle) {
      context.style = profile.history.preferredStyle;
    }

    // Adjust detail level based on behavior
    if (profile.behavior.detailLevel === 'brief') {
      context.briefMode = true;
    } else if (profile.behavior.detailLevel === 'detailed') {
      context.detailedMode = true;
    }

    // Use user preferences
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
