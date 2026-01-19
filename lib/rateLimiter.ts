/**
 * Rate Limiter - Per-user, per-endpoint rate limiting using Supabase
 * Provides protection against abuse and ensures fair usage
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Service key for admin operations
);

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number; // in milliseconds
}

/**
 * Rate limit configuration per endpoint
 * Adjust these based on your API capacity and fair usage policy
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
    '/api/generate': { maxRequests: 30, windowMs: 60000 }, // 30 per minute
    '/api/analyze-canvas': { maxRequests: 10, windowMs: 60000 }, // 10 per minute
    '/api/canvas/save': { maxRequests: 60, windowMs: 60000 }, // 60 per minute
    '/api/redesign': { maxRequests: 5, windowMs: 60000 }, // 5 per minute
    '/api/user/usage': { maxRequests: 120, windowMs: 60000 }, // 120 per minute (read-only)
};

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    limit: number;
}

/**
 * Check if user is within rate limit for endpoint
 * @param userId - User ID from authentication
 * @param endpoint - API endpoint path
 * @returns Rate limit status
 */
export async function checkRateLimit(
    userId: string,
    endpoint: string
): Promise<RateLimitResult> {
    const config = RATE_LIMITS[endpoint] || { maxRequests: 60, windowMs: 60000 };

    const windowStart = new Date(Date.now() - config.windowMs);
    const resetAt = new Date(Date.now() + config.windowMs);

    try {
        // Get current request count in window
        const { data, error } = await supabase
            .from('rate_limits')
            .select('request_count, window_start')
            .eq('user_id', userId)
            .eq('endpoint', endpoint)
            .gte('window_start', windowStart.toISOString())
            .maybeSingle();

        if (error) {
            console.error('[Rate Limit] Query error:', error);
            throw error;
        }

        const currentCount = data?.request_count || 0;
        const allowed = currentCount < config.maxRequests;

        if (allowed) {
            // Increment counter (upsert)
            const newCount = currentCount + 1;
            const windowStartTime = data?.window_start || new Date().toISOString();

            await supabase.from('rate_limits').upsert(
                {
                    user_id: userId,
                    endpoint,
                    request_count: newCount,
                    window_start: windowStartTime,
                },
                { onConflict: 'user_id,endpoint,window_start' }
            );
        }

        return {
            allowed,
            remaining: Math.max(0, config.maxRequests - currentCount - 1),
            resetAt,
            limit: config.maxRequests,
        };
    } catch (error) {
        console.error('[Rate Limit] Error:', error);
        // Fail open (allow request) on database errors to prevent service disruption
        // In production, you may want to fail closed for critical endpoints
        return {
            allowed: true,
            remaining: config.maxRequests,
            resetAt,
            limit: config.maxRequests,
        };
    }
}

/**
 * Get rate limit status without incrementing counter
 * Useful for showing user their current limits
 */
export async function getRateLimitStatus(
    userId: string,
    endpoint: string
): Promise<RateLimitResult> {
    const config = RATE_LIMITS[endpoint] || { maxRequests: 60, windowMs: 60000 };

    const windowStart = new Date(Date.now() - config.windowMs);
    const resetAt = new Date(Date.now() + config.windowMs);

    try {
        const { data, error } = await supabase
            .from('rate_limits')
            .select('request_count')
            .eq('user_id', userId)
            .eq('endpoint', endpoint)
            .gte('window_start', windowStart.toISOString())
            .maybeSingle();

        if (error) throw error;

        const currentCount = data?.request_count || 0;
        const remaining = Math.max(0, config.maxRequests - currentCount);

        return {
            allowed: remaining > 0,
            remaining,
            resetAt,
            limit: config.maxRequests,
        };
    } catch (error) {
        console.error('[Rate Limit Status] Error:', error);
        return {
            allowed: true,
            remaining: config.maxRequests,
            resetAt,
            limit: config.maxRequests,
        };
    }
}

/**
 * Reset rate limits for a user (admin function)
 */
export async function resetUserRateLimit(userId: string, endpoint?: string): Promise<void> {
    try {
        const query = supabase
            .from('rate_limits')
            .delete()
            .eq('user_id', userId);

        if (endpoint) {
            query.eq('endpoint', endpoint);
        }

        await query;
        console.log(`✅ Reset rate limits for user ${userId}${endpoint ? ` on ${endpoint}` : ''}`);
    } catch (error) {
        console.error('[Reset Rate Limit] Error:', error);
    }
}
