import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
    getUserSessions,
    deleteChatSession,
    subscribeToUserSessions,
    syncUser,
    type FirebaseChatSession
} from '@/lib/firebaseDatabase';

export interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    mode: 'builder' | 'tutor';
    provider: string;
    created_at: string;
    updated_at: string;
}

/**
 * Hook for managing chat sessions with Firebase
 * Replaces useSupabase hook
 */
export function useChatSessions() {
    const { user } = useUser();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Convert Firebase session to legacy format for compatibility
    const convertSession = (fbSession: FirebaseChatSession): ChatSession => {
        // Handle Firestore Timestamp objects
        const createdAt = fbSession.createdAt instanceof Date
            ? fbSession.createdAt.toISOString()
            : (fbSession.createdAt as any).toDate().toISOString();

        const updatedAt = fbSession.updatedAt instanceof Date
            ? fbSession.updatedAt.toISOString()
            : (fbSession.updatedAt as any).toDate().toISOString();

        return {
            id: fbSession.id,
            user_id: fbSession.userId,
            title: fbSession.title,
            mode: fbSession.mode,
            provider: fbSession.provider,
            created_at: createdAt,
            updated_at: updatedAt,
        };
    };

    // Sync user with Firebase on mount
    useEffect(() => {
        if (user) {
            syncUser(user).catch(err => {
                console.error('Failed to sync user:', err);
            });
        }
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
        const unsubscribe = subscribeToUserSessions(user.id, (fbSessions) => {
            const convertedSessions = fbSessions.map(convertSession);
            setSessions(convertedSessions);
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
            const fbSessions = await getUserSessions(user.id);
            const convertedSessions = fbSessions.map(convertSession);
            setSessions(convertedSessions);
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
        import('@/lib/firebaseDatabase').then(({ getUserPreferences }) => {
            getUserPreferences(user.id).then(prefs => {
                setPreferences(prefs);
                setLoading(false);
            });
        });
    }, [user]);

    const updatePreferences = useCallback(async (updates: any) => {
        if (!user) return false;

        const { updateUserPreferences } = await import('@/lib/firebaseDatabase');
        const success = await updateUserPreferences(user.id, updates);

        if (success) {
            setPreferences((prev: any) => ({ ...prev, ...updates }));
        }

        return success;
    }, [user]);

    return {
        preferences,
        loading,
        updatePreferences,
    };
}
