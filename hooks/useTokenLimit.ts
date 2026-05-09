// Token limit and subscription management hooks with Supabase direct fetch
// Real-time sync with daily credit management

import { useState, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../lib/authContext';
import { supabase } from '../lib/supabase';
import { getDailyUsage, incrementDailyUsage, canUseCredits, FEATURE_COSTS, getFeatureCost, subscribeToCreditUpdates } from '../lib/dailyCreditManager';

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
            const { used, limit, tier } = await getDailyUsage(user.id);
            const isPro = tier === 'pro';

            setUsage({
                used,
                limit,
                credits: isPro ? 999999 : Math.max(0, limit - used),
                tier
            });

            setIsSubscribed(isPro);
        } catch (e) {
            console.error('Failed to refresh limits:', e);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Initial fetch + Real-time subscription
    useEffect(() => {
        if (!user?.id) return;

        refreshLimit();

        // Subscribe to real-time updates from Supabase
        const subscription = subscribeToCreditUpdates(user.id, (newData) => {
            const isPro = newData.tier === 'pro';
            setUsage({
                used: newData.used,
                limit: newData.limit,
                credits: isPro ? 999999 : Math.max(0, newData.limit - newData.used),
                tier: newData.tier as 'free' | 'pro'
            });
            setIsSubscribed(isPro);
        });

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user?.id, refreshLimit]);

    // Increment usage (deduct credits)
    const incrementFeatureUsage = useCallback(async (featureType: FeatureType) => {
        if (!user?.id || isSubscribed) return;

        try {
            const cost = getFeatureCost(featureType);
            await incrementDailyUsage(user.id, cost);
            // Real-time subscription will update the state automatically
        } catch (e) {
            console.error('Failed to increment usage:', e);
            refreshLimit();
        }
    }, [user?.id, isSubscribed, refreshLimit]);

    const checkFeatureLimit = useCallback(async (featureType: FeatureType) => {
        if (!user?.id) return { exceeded: true, cost: 0, credits: 0 };
        if (isSubscribed) return { exceeded: false, cost: 0, credits: 999999 };

        const cost = getFeatureCost(featureType);
        const { allowed, remaining } = await canUseCredits(user.id, cost);

        return {
            exceeded: !allowed,
            cost,
            credits: remaining
        };
    }, [user?.id, isSubscribed]);

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
    };
}

export function useTrackAIUsage() {
    return { trackUsage: async () => true };
}
