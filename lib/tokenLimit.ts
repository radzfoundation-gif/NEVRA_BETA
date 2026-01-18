import {
    getUserTier,
    getTokenUsage,
    logAIUsage as dbLogAIUsage
} from './supabaseDatabase';
import { TIER_LIMITS } from './supabase';

// Token costs per provider (estimated)
const TOKEN_COSTS = {
    anthropic: 10,      // 10 tokens per request
    deepseek: 10,       // 10 tokens per request
    openai: 10,         // 10 tokens per request
    gemini: 10,         // 10 tokens per request
};

// Default Free tier limit from TIER_LIMITS
export const FREE_TOKEN_LIMIT = TIER_LIMITS.free.monthlyTokens;

/**
 * Check if user has exceeded token limit
 */
export async function checkTokenLimit(userId: string, _token?: string | null): Promise<{
    hasExceeded: boolean;
    tokensUsed: number;
    tokensRemaining: number;
    isSubscribed: boolean;
}> {
    try {
        // 1. Get User Tier and Usage from Supabase
        const tier = await getUserTier(userId);
        const usageData = await getTokenUsage(userId);

        const isSubscribed = tier === 'pro';
        const used = usageData?.tokens_used || 0;

        // 2. Determine Limit
        const limit = TIER_LIMITS[tier].monthlyTokens;

        // 3. Check for Unlimited (-1)
        if (limit < 0 || isSubscribed) {
            return {
                hasExceeded: false,
                tokensUsed: used,
                tokensRemaining: 999999, // Display as Unlimited
                isSubscribed: true,
            };
        }

        // 4. Check Limit
        const hasExceeded = used >= limit;

        return {
            hasExceeded,
            tokensUsed: used,
            tokensRemaining: Math.max(0, limit - used),
            isSubscribed: false,
        };
    } catch (error) {
        console.error('Error checking token limit (Supabase):', error);
        // Fail open
        return {
            hasExceeded: false,
            tokensUsed: 0,
            tokensRemaining: FREE_TOKEN_LIMIT,
            isSubscribed: false,
        };
    }
}

/**
 * Track AI usage
 */
export async function trackAIUsage(
    userId: string,
    sessionId: string,
    provider: 'anthropic' | 'deepseek' | 'openai' | 'gemini',
    model?: string,
    _token?: string | null
): Promise<boolean> {
    try {
        const tokensToCharge = TOKEN_COSTS[provider] || 10;

        // Log usage to Supabase (this handles monthly increment)
        await dbLogAIUsage(
            userId,
            sessionId,
            provider,
            model || 'default',
            tokensToCharge,
            0
        );

        console.log(`[TokenLimit] Charged ${tokensToCharge} tokens for ${provider} (Supabase)`);
        return true;
    } catch (error) {
        console.error('Error tracking usage:', error);
        return false;
    }
}

/**
 * Get user's token usage summary
 */
export async function getTokenUsageSummary(userId: string): Promise<{
    totalTokens: number;
    usageByProvider: Record<string, number>;
    recentUsage: Array<{ date: string; tokens: number }>;
}> {
    try {
        const usageData = await getTokenUsage(userId);
        return {
            totalTokens: usageData?.tokens_used || 0,
            usageByProvider: {},
            recentUsage: [],
        };
    } catch (error) {
        return {
            totalTokens: 0,
            usageByProvider: {},
            recentUsage: [],
        };
    }
}

/**
 * Upgrade user to subscription (Legacy/Placeholder)
 * Actual upgrade happens via Midtrans/Stripe callback -> API -> supabase activateProSubscription
 */
export async function upgradeSubscription(
    _userId: string,
    _plan: 'premium' | 'pro' | 'enterprise'
): Promise<boolean> {
    console.log(`[TokenLimit] Upgrade subscription logic moved to API endpoints`);
    return true;
}
