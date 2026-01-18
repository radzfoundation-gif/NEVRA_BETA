import { useState, useEffect, useCallback } from 'react';
import { useUser, useSession } from '@/lib/authContext';
import { ChatSession } from '@/lib/supabase';
import {
    getUserSessions,
    deleteChatSession,
    subscribeToUserSessions,
    syncUser,
    getUserPreferences,
    updateUserPreferences,
    getSubscription,
    getUserTier,
} from '@/lib/supabaseDatabase';

// Re-export ChatSession type
export type { ChatSession };

/**
 * Hook for managing chat sessions with Supabase
 * Replaces Firebase hook with same API
 */
export function useChatSessions() {
    const { user } = useUser();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sync user with Supabase on mount
    // With Supabase Auth, the session is already established - just need to sync user data
    useEffect(() => {
        const initSync = async () => {
            if (user) {
                try {
                    // Supabase Auth already handles the token, just sync user metadata
                    await syncUser({
                        id: user.id,
                        emailAddresses: user.emailAddresses,
                        fullName: user.fullName,
                        imageUrl: user.imageUrl,
                    });
                    console.log('[Auth] User synced to database');
                } catch (err) {
                    // Don't crash the app - just log and continue
                    console.warn('[Auth] Error during user sync (non-fatal):', err);
                }
            }
        };
        initSync();
    }, [user]);

    // Subscribe to sessions with real-time updates
    useEffect(() => {
        if (!user) {
            setSessions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Subscribe to real-time updates
        const unsubscribe = subscribeToUserSessions(user.id, (supabaseSessions) => {
            setSessions(supabaseSessions);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [user]);

    // Refresh sessions manually (for compatibility)
    const refreshSessions = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const supabaseSessions = await getUserSessions(user.id);
            setSessions(supabaseSessions);
        } catch (err) {
            console.error('Error refreshing sessions:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh sessions');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Delete session
    const deleteSession = useCallback(async (sessionId: string) => {
        try {
            const success = await deleteChatSession(sessionId);
            if (success) {
                // Remove from local state immediately for better UX
                setSessions(prev => prev.filter(s => s.id !== sessionId));
            }
            return success;
        } catch (err) {
            console.error('Error deleting session:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete session');
            return false;
        }
    }, []);

    return {
        sessions,
        loading,
        error,
        deleteSession,
        refreshSessions,
    };
}

/**
 * Hook for user preferences
 */
export function useUserPreferences() {
    const { user } = useUser();
    const [preferences, setPreferences] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setPreferences(null);
            setLoading(false);
            return;
        }

        // Load preferences
        getUserPreferences(user.id).then(prefs => {
            setPreferences(prefs);
            setLoading(false);
        });
    }, [user]);

    const updatePrefs = useCallback(async (updates: any) => {
        if (!user) return false;

        const success = await updateUserPreferences(user.id, updates);

        if (success) {
            setPreferences((prev: any) => ({ ...prev, ...updates }));
        }

        return success;
    }, [user]);

    return {
        preferences,
        loading,
        updatePreferences: updatePrefs,
    };
}

/**
 * Hook for subscription status
 * Fetches from backend API to ensure consistency with file-based storage
 */
export function useSubscription() {
    const { user } = useUser();
    const [subscription, setSubscription] = useState<any>(null);
    const [tier, setTier] = useState<'free' | 'pro'>('free');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setSubscription(null);
            setTier('free');
            setLoading(false);
            return;
        }

        // Fetch tier from backend API (works with both Supabase and file storage)
        fetch(`/api/user/usage?userId=${user.id}`)
            .then(res => res.json())
            .then(data => {
                setTier(data.tier || 'free');
                setSubscription({ tier: data.tier });
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching subscription:', err);
                setTier('free');
                setLoading(false);
            });
    }, [user]);

    const refresh = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/user/usage?userId=${user.id}`);
            const data = await res.json();
            setTier(data.tier || 'free');
            setSubscription({ tier: data.tier });
        } catch (err) {
            console.error('Error refreshing subscription:', err);
        }
        setLoading(false);
    }, [user]);

    return {
        subscription,
        tier,
        isPro: tier === 'pro',
        loading,
        refresh,
    };
}
