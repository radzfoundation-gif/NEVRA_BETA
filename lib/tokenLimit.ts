// Token limit utilities - Firebase version
// Note: Token tracking disabled for now, returning unlimited tokens

// Token costs per provider (estimated)
const TOKEN_COSTS = {
    anthropic: 10,      // 10 tokens per request
    deepseek: 10,       // 10 tokens per request
    openai: 10,         // 10 tokens per request
    gemini: 10,         // 10 tokens per request
};

// Free tier limit (tokens). Set to very high value for now
export const FREE_TOKEN_LIMIT = 999999999;

/**
 * Check if user has exceeded token limit
 * Currently returns unlimited tokens (token tracking disabled)
 */
export async function checkTokenLimit(_userId: string, _token?: string | null): Promise<{
    hasExceeded: boolean;
    tokensUsed: number;
    tokensRemaining: number;
    isSubscribed: boolean;
}> {
    // Token tracking disabled - return unlimited
    return {
        hasExceeded: false,
        tokensUsed: 0,
        tokensRemaining: FREE_TOKEN_LIMIT,
        isSubscribed: false,
    };
}

/**
 * Track AI usage
 * Currently no-op (token tracking disabled)
 */
export async function trackAIUsage(
    _userId: string,
    _sessionId: string,
    provider: 'anthropic' | 'deepseek' | 'openai' | 'gemini',
    _model?: string,
    _token?: string | null
): Promise<boolean> {
    // Token tracking disabled - just log
    console.log(`[TokenLimit] AI usage: provider=${provider}`);
    return true;
}

/**
 * Get user's token usage summary
 * Currently returns empty data (token tracking disabled)
 */
export async function getTokenUsageSummary(_userId: string): Promise<{
    totalTokens: number;
    usageByProvider: Record<string, number>;
    recentUsage: Array<{ date: string; tokens: number }>;
}> {
    return {
        totalTokens: 0,
        usageByProvider: {},
        recentUsage: [],
    };
}

/**
 * Upgrade user to subscription
 * Currently no-op (subscriptions handled by Stripe webhook)
 */
export async function upgradeSubscription(
    _userId: string,
    _plan: 'premium' | 'pro' | 'enterprise'
): Promise<boolean> {
    console.log(`[TokenLimit] Upgrade subscription - handled by Stripe webhook`);
    return true;
}
