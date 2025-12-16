// Token limit hooks - Stub version (Supabase removed)
// Token tracking disabled - returns unlimited tokens

import { useState, useCallback } from 'react';

export const FREE_TOKEN_LIMIT = 999999999;

/**
 * Hook to check and manage token limits
 * Currently returns unlimited tokens (tracking disabled)
 */
export function useTokenLimit() {
    const [loading] = useState(false);

    const refreshLimit = useCallback(() => {
        // No-op - token limits disabled
    }, []);

    const incrementTokenUsage = useCallback(() => {
        // No-op - token tracking disabled
    }, []);

    return {
        hasExceeded: false,
        tokensUsed: 0,
        tokensRemaining: FREE_TOKEN_LIMIT,
        isSubscribed: false,
        loading,
        refreshLimit,
        incrementTokenUsage,
    };
}

/**
 * Hook to track AI usage
 * Currently no-op (tracking disabled)
 */
export function useTrackAIUsage() {
    const trackUsage = useCallback(async (
        _sessionId: string,
        _provider: string,
        _model?: string
    ) => {
        // No-op - tracking disabled
        console.log('[TokenLimit] AI usage tracking disabled');
        return true;
    }, []);

    return { trackUsage };
}
