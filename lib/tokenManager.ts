/**
 * Token Manager - Usage-based quota system with atomic operations
 * Handles token checking, deduction, and usage tracking
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Service key for admin operations
);

/**
 * Token cost per request type
 * Adjust based on computational cost and pricing strategy
 */
export const TOKEN_COSTS = {
    chat: 1,
    canvas_analyze: 2,
    redesign: 3,
} as const;

export type RequestType = keyof typeof TOKEN_COSTS;

/**
 * Check if user has sufficient tokens for a request
 * @param userId - User ID from authentication
 * @param cost - Token cost of the operation
 * @returns true if user has enough tokens
 */
export async function checkTokens(userId: string, cost: number): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc('get_user_tokens', {
            user_uuid: userId
        });

        if (error) {
            console.error('[Token Check] RPC error:', error);
            throw error;
        }

        const balance = (data as number) || 0;
        return balance >= cost;
    } catch (error) {
        console.error('[Token Check] Error:', error);
        return false;
    }
}

/**
 * Deduct tokens from user's balance (atomic operation)
 * @param userId - User ID
 * @param cost - Token cost
 * @param requestType - Type of request for logging
 * @param metadata - Optional metadata (prompt length, response length, etc.)
 * @returns true if deduction successful
 */
export async function deductTokens(
    userId: string,
    cost: number,
    requestType: RequestType,
    metadata?: {
        promptLength?: number;
        responseLength?: number;
        model?: string;
    }
): Promise<boolean> {
    try {
        // Deduct tokens atomically using database function
        const { data: success, error: deductError } = await supabase.rpc('deduct_tokens', {
            user_uuid: userId,
            amount: cost,
        });

        if (deductError) {
            console.error('[Token Deduct] RPC error:', deductError);
            throw deductError;
        }

        if (!success) {
            console.warn(`[Token Deduct] Insufficient tokens for user ${userId}`);
            return false;
        }

        // Log usage for analytics and billing
        const { error: logError } = await supabase.from('ai_usage').insert({
            user_id: userId,
            tokens_used: cost,
            request_type: requestType,
            model: metadata?.model || 'sumopod-llm',
            prompt_length: metadata?.promptLength,
            response_length: metadata?.responseLength,
        });

        if (logError) {
            console.error('[Token Deduct] Logging error:', logError);
            // Don't fail the deduction if logging fails
        }

        console.log(`✅ Deducted ${cost} tokens from user ${userId} (${requestType})`);
        return true;
    } catch (error) {
        console.error('[Token Deduct] Error:', error);
        return false;
    }
}

/**
 * Get user's current token balance
 */
export async function getTokenBalance(userId: string): Promise<{
    balance: number;
    plan: string;
    resetAt: Date;
}> {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('tokens_remaining, plan, tokens_reset_at')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return {
            balance: data?.tokens_remaining || 0,
            plan: data?.plan || 'free',
            resetAt: new Date(data?.tokens_reset_at || Date.now()),
        };
    } catch (error) {
        console.error('[Get Token Balance] Error:', error);
        return {
            balance: 0,
            plan: 'free',
            resetAt: new Date(),
        };
    }
}

/**
 * Get user's usage statistics
 */
export async function getUserUsage(userId: string) {
    try {
        // Get current token balance and plan
        const { balance, plan, resetAt } = await getTokenBalance(userId);

        // Get usage stats using database function
        const { data: stats, error: statsError } = await supabase.rpc('get_user_usage_stats', {
            user_uuid: userId,
            days_back: 30,
        });

        if (statsError) throw statsError;

        // Get recent usage history
        const { data: recentUsage, error: historyError } = await supabase
            .from('ai_usage')
            .select('request_type, tokens_used, created_at, model')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (historyError) throw historyError;

        return {
            plan,
            tokensRemaining: balance,
            resetAt,
            stats: stats?.[0] || {
                total_requests: 0,
                total_tokens: 0,
                chat_requests: 0,
                canvas_requests: 0,
                redesign_requests: 0,
            },
            recentUsage: recentUsage || [],
        };
    } catch (error) {
        console.error('[Get User Usage] Error:', error);
        return {
            plan: 'free',
            tokensRemaining: 0,
            resetAt: new Date(),
            stats: {
                total_requests: 0,
                total_tokens: 0,
                chat_requests: 0,
                canvas_requests: 0,
                redesign_requests: 0,
            },
            recentUsage: [],
        };
    }
}

/**
 * Manually add tokens to user (admin function or purchase credits)
 */
export async function addTokens(
    userId: string,
    amount: number,
    reason: string = 'manual_credit'
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({
                tokens_remaining: supabase.raw(`tokens_remaining + ${amount}`) as any
            })
            .eq('id', userId);

        if (error) throw error;

        console.log(`✅ Added ${amount} tokens to user ${userId} (${reason})`);
        return true;
    } catch (error) {
        console.error('[Add Tokens] Error:', error);
        return false;
    }
}

/**
 * Check if user is Pro (unlimited tokens)
 */
export async function isUserPro(userId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('plan')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return data?.plan === 'pro' || data?.plan === 'enterprise';
    } catch (error) {
        console.error('[Is User Pro] Error:', error);
        return false;
    }
}
