// Token limit and subscription management hooks

import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@/lib/authContext';

export const DAILY_CREDIT_LIMIT = 20;

export const FEATURE_COSTS = {
    chat: 1,
    convert: 3,
    youtube: 2,
    audio: 2,
    redesign: 5,
    image: 5,
    knowledge: 2
};

export type FeatureType = keyof typeof FEATURE_COSTS;

export function useTokenLimit() {
    const { user } = useUser();
    const [usage, setUsage] = useState({
        used: 0,
        limit: DAILY_CREDIT_LIMIT,
        credits: 20,
        tier: 'free' as 'free' | 'pro'
    });
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    // Soft limit warning (when <= 5 credits remain)
    const softLimitReached = !isSubscribed && usage.credits <= 5 && usage.credits > 0;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8788';

    const refreshLimit = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/user/feature-usage?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                const newTier = data.tier || 'free';
                const isPro = newTier === 'pro';

                setUsage({
                    used: data.used,
                    limit: data.limit,
                    credits: data.credits,
                    tier: newTier
                });

                setIsSubscribed(isPro);
            }
        } catch (e) {
            console.error('Failed to refresh limits', e);
        } finally {
            setLoading(false);
        }
    }, [user?.id, apiUrl]);

    useEffect(() => {
        if (!user?.id) return;
        refreshLimit();
        const interval = setInterval(refreshLimit, 120000); // 2 mins
        return () => clearInterval(interval);
    }, [refreshLimit, user?.id]);

    // Check if user has enough credits for a feature
    const checkFeatureLimit = useCallback((featureType: FeatureType) => {
        if (isSubscribed) {
            return { exceeded: false, cost: 0, credits: 999 };
        }

        const cost = FEATURE_COSTS[featureType] || 1;
        const currentCredits = usage.credits;

        return {
            exceeded: currentCredits < cost,
            cost,
            credits: currentCredits
        };
    }, [isSubscribed, usage.credits]);

    // Increment usage (deduct credits)
    const incrementFeatureUsage = useCallback(async (featureType: FeatureType) => {
        if (!user?.id || isSubscribed) return;

        try {
            // Optimistic update
            const cost = FEATURE_COSTS[featureType] || 1;
            setUsage(prev => ({
                ...prev,
                used: prev.used + cost,
                credits: Math.max(0, prev.credits - cost)
            }));

            const res = await fetch(`${apiUrl}/api/user/feature-usage/increment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, featureType })
            });

            if (res.ok) {
                // Sync with server response to be sure
                const data = await res.json();
                setUsage(prev => ({
                    ...prev,
                    used: data.newUsage,
                    credits: data.remaining
                }));
            }
        } catch (e) {
            console.error('Failed to increment usage', e);
            refreshLimit(); // Revert on error
        }
    }, [user?.id, isSubscribed, apiUrl, refreshLimit]);

    // Backward compatibility & Feature tracking
    const featureUsage = {
        chat: { used: usage.used, limit: usage.limit },
        convert: { used: usage.used, limit: usage.limit },
        youtube: { used: usage.used, limit: usage.limit },
        audio: { used: usage.used, limit: usage.limit },
        redesign: { used: usage.used, limit: usage.limit },
        image: { used: usage.used, limit: usage.limit },
        knowledge: { used: usage.used, limit: usage.limit }
    };

    const hasExceeded = usage.credits <= 0 && !isSubscribed;
    const tokensUsed = usage.used;
    const incrementTokenUsage = useCallback(() => incrementFeatureUsage('chat'), [incrementFeatureUsage]);


    return {
        credits: isSubscribed ? 'Unlimited' : usage.credits,
        maxCredits: usage.limit,
        isSubscribed,
        tier: usage.tier,
        loading,
        softLimitReached,
        checkFeatureLimit,
        incrementFeatureUsage,
        refreshLimit,
        // Legacy/Compat
        featureUsage,
        hasExceeded,
        tokensUsed,
        incrementTokenUsage
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
