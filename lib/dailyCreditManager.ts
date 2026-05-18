// Daily Credit Manager - Firestore-backed credit tracking
// Ensures no rate limiting and proper sync between frontend and backend

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
 * Get user's daily credit usage from Firestore
 */
export async function getDailyUsage(userId: string): Promise<{ used: number; limit: number; tier: 'free' | 'pro' }> {
    const month = getCurrentMonth();
    const day = getCurrentDay();
    const cacheKey = `${userId}_${month}_${day}`;

    const cached = creditCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return { used: cached.credits, limit: cached.limit, tier: cached.tier };
    }

    try {
        const res = await fetch(`/api/db/credits?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error('Failed to load credits');
        const data = await res.json();
        const used = Number(data.used || 0);
        const limit = Number(data.limit || 20);
        const tier = data.tier === 'pro' ? 'pro' : 'free';
        creditCache.set(cacheKey, { credits: used, limit, tier, timestamp: Date.now() });
        return { used, limit, tier };
    } catch {
        return { used: 0, limit: 20, tier: 'free' };
    }
}

export async function incrementDailyUsage(userId: string, amount: number = 1): Promise<{ success: boolean; newUsage: number; remaining: number }> {
    const month = getCurrentMonth();
    const day = getCurrentDay();
    const cacheKey = `${userId}_${month}_${day}`;

    try {
        const res = await fetch('/api/db/credits/increment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount }),
        });
        if (!res.ok) throw new Error('Failed to increment credits');
        const data = await res.json();
        creditCache.delete(cacheKey);
        return {
            success: true,
            newUsage: Number(data.used || 0),
            remaining: Number(data.credits || 0),
        };
    } catch {
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
    const load = async () => callback(await getDailyUsage(userId));
    load();
    const interval = window.setInterval(load, 10000);
    return { unsubscribe: () => window.clearInterval(interval) };
}
