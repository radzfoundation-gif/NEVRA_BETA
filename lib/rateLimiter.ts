/** Firestore-only in-memory rate limiter. */
export interface RateLimitConfig { maxRequests: number; windowMs: number; }
export interface RateLimitResult { allowed: boolean; remaining: number; resetAt: Date; limit: number; }

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
    '/api/generate': { maxRequests: 30, windowMs: 60000 },
    '/api/analyze-canvas': { maxRequests: 10, windowMs: 60000 },
    '/api/canvas/save': { maxRequests: 60, windowMs: 60000 },
    '/api/redesign': { maxRequests: 5, windowMs: 60000 },
    '/api/user/usage': { maxRequests: 120, windowMs: 60000 },
};

const buckets = new Map<string, { count: number; resetAt: number }>();

const getBucket = (userId: string, endpoint: string, config: RateLimitConfig) => {
    const key = `${userId}:${endpoint}`;
    const current = buckets.get(key);
    if (!current || Date.now() > current.resetAt) {
        const fresh = { count: 0, resetAt: Date.now() + config.windowMs };
        buckets.set(key, fresh);
        return fresh;
    }
    return current;
};

export async function checkRateLimit(userId: string, endpoint: string): Promise<RateLimitResult> {
    const config = RATE_LIMITS[endpoint] || { maxRequests: 60, windowMs: 60000 };
    const bucket = getBucket(userId, endpoint, config);
    const allowed = bucket.count < config.maxRequests;
    if (allowed) bucket.count += 1;
    return { allowed, remaining: Math.max(0, config.maxRequests - bucket.count), resetAt: new Date(bucket.resetAt), limit: config.maxRequests };
}

export async function getRateLimitStatus(userId: string, endpoint: string): Promise<RateLimitResult> {
    const config = RATE_LIMITS[endpoint] || { maxRequests: 60, windowMs: 60000 };
    const bucket = getBucket(userId, endpoint, config);
    return { allowed: bucket.count < config.maxRequests, remaining: Math.max(0, config.maxRequests - bucket.count), resetAt: new Date(bucket.resetAt), limit: config.maxRequests };
}

export async function resetUserRateLimit(userId: string, endpoint?: string): Promise<void> {
    for (const key of Array.from(buckets.keys())) {
        if (key.startsWith(`${userId}:`) && (!endpoint || key === `${userId}:${endpoint}`)) buckets.delete(key);
    }
}
