// Daily Credit Manager - Real-time credit tracking with Supabase sync
// Ensures no rate limiting and proper sync between frontend and backend

import { supabase } from './supabase';

// Cache for credit data to reduce API calls
const creditCache = new Map<string, { credits: number; limit: number; tier: 'free' | 'pro'; timestamp: number }>();

const CACHE_TTL = 30000; // 30 seconds

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get current day in YYYY-MM-DD format
 */
export function getCurrentDay(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Get daily credit limit based on tier
 */
export function getDailyCreditLimit(tier: 'free' | 'pro'): number {
    if (tier === 'pro') return -1; // Unlimited
    return 20; // Daily credit for free tier
}

/**
 * Get user's daily credit usage from Supabase
 */
export async function getDailyUsage(userId: string): Promise<{ used: number; limit: number; tier: 'free' | 'pro' }> {
    const month = getCurrentMonth();
    const day = getCurrentDay();
    const cacheKey = `${userId}_${month}_${day}`;

    // Check cache first
    const cached = creditCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return { used: cached.credits, limit: cached.limit, tier: cached.tier };
    }

    try {
        // Get user tier
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('tier, status, valid_until')
            .eq('user_id', userId)
            .maybeSingle();

        const tier = subscription?.status === 'active' && subscription.valid_until
            ? new Date(subscription.valid_until) > new Date() ? 'pro' : 'free'
            : 'free';

        // Get daily usage from token_usage table
        const { data: usage } = await supabase
            .from('token_usage')
            .select('tokens_used')
            .eq('user_id', userId)
            .eq('month', `${month}_${day}`)
            .maybeSingle();

        const used = usage?.tokens_used || 0;
        const limit = getDailyCreditLimit(tier);

        // Cache the result
        creditCache.set(cacheKey, { credits: used, limit, tier, timestamp: Date.now() });

        return { used, limit, tier };
    } catch (error) {
        return { used: 0, limit: 20, tier: 'free' };
    }
}

/**
 * Increment daily usage by amount
 */
export async function incrementDailyUsage(userId: string, amount: number = 1): Promise<{ success: boolean; newUsage: number; remaining: number }> {
    const month = getCurrentMonth();
    const day = getCurrentDay();
    const cacheKey = `${userId}_${month}_${day}`;

    try {
        // First check current usage
        const { data: existing } = await supabase
            .from('token_usage')
            .select('tokens_used')
            .eq('user_id', userId)
            .eq('month', `${month}_${day}`)
            .maybeSingle();

        const current = existing?.tokens_used || 0;
        const newUsage = current + amount;

        // Upsert or insert
        const { error } = await supabase
            .from('token_usage')
            .upsert({
                user_id: userId,
                month: `${month}_${day}`,
                tokens_used: newUsage,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, month' });

        if (error) throw error;

        // Clear cache
        creditCache.delete(cacheKey);

        // Get tier for remaining calculation
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('tier, status, valid_until')
            .eq('user_id', userId)
            .maybeSingle();

        const tier = subscription?.status === 'active' && subscription.valid_until
            ? new Date(subscription.valid_until) > new Date() ? 'pro' : 'free'
            : 'free';

        const limit = getDailyCreditLimit(tier);
        const remaining = tier === 'pro' ? 999999 : Math.max(0, limit - newUsage);

        return { success: true, newUsage, remaining };
    } catch (error) {
        return { success: false, newUsage: 0, remaining: 0 };
    }
}

/**
 * Check if user can use more credits
 */
export async function canUseCredits(userId: string, amount: number = 1): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
    const { used, limit, tier } = await getDailyUsage(userId);

    if (tier === 'pro') {
        return { allowed: true, used, limit, remaining: 999999 };
    }

    const remaining = limit - used;
    return {
        allowed: used + amount <= limit,
        used,
        limit,
        remaining
    };
}

/**
 * Reset daily usage (called at midnight)
 */
export async function resetDailyUsage(): Promise<void> {
    creditCache.clear();
}

/**
 * Get all feature costs
 */
export const FEATURE_COSTS = {
    chat: 1,
    convert: 3,
    youtube: 2,
    audio: 2,
    redesign: 5,
    image: 5,
    knowledge: 2,
    deep_dive: 5
};

/**
 * Get cost for a feature type
 */
export function getFeatureCost(featureType: keyof typeof FEATURE_COSTS): number {
    return FEATURE_COSTS[featureType] || 1;
}

/**
 * Check if user can afford a feature
 */
export async function canAffordFeature(userId: string, featureType: keyof typeof FEATURE_COSTS): Promise<{ allowed: boolean; cost: number; remaining: number }> {
    const cost = getFeatureCost(featureType);
    const result = await canUseCredits(userId, cost);
    return {
        allowed: result.allowed,
        cost,
        remaining: result.remaining
    };
}

/**
 * Listen for realtime credit updates
 * Ensures channel is created correctly before subscribing
 */
export function subscribeToCreditUpdates(userId: string, callback: (usage: { used: number, limit: number, tier: string }) => void) {
    // Unique channel name per session to avoid conflicts
    const channelName = `credits:${userId}-${Math.random().toString(36).substring(7)}`;
    
    const channel = supabase.channel(channelName);
    
    // Configure callbacks BEFORE calling subscribe()
    channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'token_usage',
        filter: `user_id=eq.${userId}`
    }, async () => {
        // Clear cache and fetch fresh data
        const month = getCurrentMonth();
        const day = getCurrentDay();
        creditCache.delete(`${userId}_${month}_${day}`);
        
        const usage = await getDailyUsage(userId);
        callback(usage);
    });

    // Now subscribe
    channel.subscribe();

    return channel;
}
