import { supabase, createAuthenticatedClient } from './supabase';

// Grok (Kimi K2) specific token limit: 200 tokens
export const GROK_TOKEN_LIMIT = 200;

// Helpers: WIB (UTC+7) date boundaries
const getWIBBounds = (date: Date = new Date()) => {
    const utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const year = utc.getUTCFullYear();
    const month = utc.getUTCMonth();
    const day = utc.getUTCDate();
    const startUTC = Date.UTC(year, month, day, -7, 0, 0, 0);
    const endUTC = Date.UTC(year, month, day + 1, -7, 0, 0, 0);
    return {
        start: new Date(startUTC).toISOString(),
        end: new Date(endUTC).toISOString(),
    };
};

/**
 * Check if user has exceeded Grok (Kimi K2) token limit
 * Returns true if user should fallback to Llama 3 (groq)
 */
export async function checkGrokTokenLimit(
    userId: string, 
    token?: string | null
): Promise<{
    hasExceeded: boolean;
    tokensUsed: number;
    tokensRemaining: number;
    shouldFallback: boolean; // Should fallback to groq
}> {
    const client = token ? createAuthenticatedClient(token) : supabase;
    const { start, end } = getWIBBounds();

    // Get tokens used by grok provider only
    const { data: usage, error: usageError } = await client
        .from('ai_usage')
        .select('tokens_used')
        .eq('user_id', userId)
        .eq('provider', 'grok')
        .gte('created_at', start)
        .lt('created_at', end);
    
    if (usageError) {
        console.error('Error checking grok token limit:', usageError);
        // On error, allow usage but log it
        return {
            hasExceeded: false,
            tokensUsed: 0,
            tokensRemaining: GROK_TOKEN_LIMIT,
            shouldFallback: false,
        };
    }

    const tokensUsed = usage?.reduce((sum, record) => sum + (record.tokens_used || 0), 0) || 0;
    const tokensRemaining = Math.max(0, GROK_TOKEN_LIMIT - tokensUsed);
    const hasExceeded = tokensUsed >= GROK_TOKEN_LIMIT;

    return {
        hasExceeded,
        tokensUsed,
        tokensRemaining,
        shouldFallback: hasExceeded, // Fallback to groq if limit exceeded
    };
}
