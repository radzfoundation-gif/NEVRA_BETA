// Token limit and subscription management hooks with Supabase direct fetch

import { useState, useCallback, useEffect, useRef } from 'react';
import { useUser } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';

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
    const lastFetchRef = useRef<number>(0);

    // Soft limit warning (when <= 5 credits remain)
    const softLimitReached = !isSubscribed && usage.credits <= 5 && usage.credits > 0;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8788';

    // Fetch subscription directly from Supabase - PRIMARY source of truth
    const fetchSubscriptionFromSupabase = useCallback(async (force = false) => {
        if (!user?.id) return;

        // Debounce: Don't fetch more than once per 5 seconds unless forced
        const now = Date.now();
        if (!force && now - lastFetchRef.current < 5000) {
            return;
        }
        lastFetchRef.current = now;

        try {
            console.log('[TokenLimit] Fetching subscription from Supabase...');

            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('[TokenLimit] Supabase error:', error);
                return;
            }

            if (data) {
                let isPro = data.tier === 'pro';

                // Check if Pro has expired
                if (isPro && data.expires_at) {
                    const expiryDate = new Date(data.expires_at);
                    if (expiryDate < new Date()) {
                        isPro = false;
                        console.log('[TokenLimit] Pro subscription expired');
                    }
                }

                setIsSubscribed(isPro);
                setUsage(prev => ({ ...prev, tier: isPro ? 'pro' : 'free' }));
                console.log(`[TokenLimit] ✅ Subscription synced from Supabase: ${isPro ? 'PRO' : 'FREE'}`);
            } else {
                // No subscription record - create one
                console.log('[TokenLimit] No subscription found, creating free tier...');
                setIsSubscribed(false);
                setUsage(prev => ({ ...prev, tier: 'free' }));
            }
        } catch (e) {
            console.error('[TokenLimit] Failed to fetch subscription from Supabase', e);
        }
    }, [user?.id]);

    const refreshLimit = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);

        // First, always fetch from Supabase directly for subscription status
        await fetchSubscriptionFromSupabase(true);

        try {
            const res = await fetch(`${apiUrl}/api/user/feature-usage?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                const newTier = data.tier || 'free';
                const isPro = newTier === 'pro';

                setUsage({
                    used: data.used || 0,
                    limit: data.limit || DAILY_CREDIT_LIMIT,
                    credits: data.credits || 20,
                    tier: newTier
                });

                setIsSubscribed(isPro);
            }
        } catch (e) {
            console.error('Failed to refresh limits from API, using Supabase data');
            // Supabase fetch already done above
        } finally {
            setLoading(false);
        }
    }, [user?.id, apiUrl, fetchSubscriptionFromSupabase]);

    // Initial fetch + polling every 30 seconds for better sync
    useEffect(() => {
        if (!user?.id) return;

        // Immediate fetch
        fetchSubscriptionFromSupabase(true);
        refreshLimit();

        // Poll every 30 seconds for near-realtime sync
        const interval = setInterval(() => {
            fetchSubscriptionFromSupabase(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchSubscriptionFromSupabase, refreshLimit, user?.id]);

    // Also fetch when window gains focus (user comes back to tab)
    useEffect(() => {
        if (!user?.id) return;

        const handleFocus = () => {
            console.log('[TokenLimit] Window focused - syncing subscription...');
            fetchSubscriptionFromSupabase(true);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[TokenLimit] Tab visible - syncing subscription...');
                fetchSubscriptionFromSupabase(true);
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchSubscriptionFromSupabase, user?.id]);

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
