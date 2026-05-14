// Token limit and subscription management hooks with Supabase direct fetch
// Real-time sync with daily credit management

import { useState, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../lib/authContext';
import { FEATURE_COSTS, getFeatureCost } from '../lib/dailyCreditManager';

export const DAILY_CREDIT_LIMIT = 20;

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

    // Fetch subscription and daily usage
    const refreshLimit = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/turso/credits?userId=${encodeURIComponent(user.id)}`);
            if (!res.ok) throw new Error('Failed to load Turso credits');
            const { used, limit, tier, credits } = await res.json();
            const isPro = tier === 'pro';

            setUsage({ used, limit, credits, tier });
            setIsSubscribed(isPro);
        } catch (e) {
            console.error('Failed to refresh limits:', e);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Initial fetch + lightweight polling for Turso-backed credit sync
    useEffect(() => {
        if (!user?.id) return;

        refreshLimit();
        const interval = window.setInterval(refreshLimit, 10000);
        return () => window.clearInterval(interval);
    }, [user?.id, refreshLimit]);

    // Increment usage (deduct credits)
    const incrementFeatureUsage = useCallback(async (featureType: FeatureType) => {
        if (!user?.id || isSubscribed) return;

        try {
            const cost = getFeatureCost(featureType);
            setUsage(prev => {
                const nextUsed = prev.used + cost;
                return {
                    ...prev,
                    used: nextUsed,
                    credits: prev.tier === 'pro' ? 999999 : Math.max(0, prev.limit - nextUsed),
                };
            });
            await fetch('/api/turso/credits/increment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, amount: cost }),
            });
            refreshLimit();
        } catch (e) {
            console.error('Failed to increment usage:', e);
            refreshLimit();
        }
    }, [user?.id, isSubscribed, refreshLimit]);

    const checkFeatureLimit = useCallback(async (featureType: FeatureType) => {
        if (!user?.id) return { exceeded: true, cost: 0, credits: 0 };
        if (isSubscribed) return { exceeded: false, cost: 0, credits: 999999 };

        // Fast path: use cached usage from the 10s poller. Avoids a blocking
        // network round-trip on every "send" click — the polled value is
        // accurate within ~10s and we re-check server-side anyway.
        const cost = getFeatureCost(featureType);
        const cachedAllowed = usage.tier === 'pro' || usage.credits >= cost;
        return {
            exceeded: !cachedAllowed,
            cost,
            credits: usage.credits,
        };
    }, [user?.id, isSubscribed, usage.tier, usage.credits]);

    return {
        credits: isSubscribed ? 'Unlimited' : usage.credits,
        maxCredits: usage.limit,
        isSubscribed,
        tier: usage.tier,
        loading,
        checkFeatureLimit,
        incrementFeatureUsage,
        refreshLimit,
        tokensUsed: usage.used,
        hasExceeded: usage.credits <= 0 && !isSubscribed,
        softLimitReached: !isSubscribed && usage.credits <= 5,
        incrementTokenUsage: () => incrementFeatureUsage('chat'),
    };
}

export function useTrackAIUsage() {
    return { trackUsage: async () => true };
}
