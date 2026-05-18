import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/authContext';
import {
    ChatSession,
    getUserSessions,
    deleteChatSession,
    subscribeToUserSessions,
    syncUser,
    getUserPreferences,
    updateUserPreferences,
} from '@/lib/database';

// Re-export ChatSession type
export type { ChatSession };


const apiJson = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const res = await fetch(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return res.json();
};


/**
 * Hook for managing chat sessions with Firestore
 * Replaces Firebase hook with same API
 */
export function useChatSessions() {
    const { user } = useUser();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sync user with Firestore on mount
    // With Firestore Auth, the session is already established - just need to sync user data
    useEffect(() => {
        const initSync = async () => {
            if (user) {
                try {
                    // Firestore Auth already handles the token, just sync user metadata
                    await syncUser({
                        id: user.id,
                        emailAddresses: user.emailAddresses,
                        fullName: user.fullName,
                        imageUrl: user.imageUrl,
                    });
                    // User synced to database
                } catch (err) {
                    // Don't crash the app - just log and continue
                    // Non-fatal user sync error - handled gracefully
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
        const unsubscribe = subscribeToUserSessions(user.id, (firestoreSessions) => {
            setSessions(firestoreSessions);
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
            const firestoreSessions = await getUserSessions(user.id);
            setSessions(firestoreSessions);
        } catch (err) {
            // Error refreshing sessions - handled by error state
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
            // Error deleting session - handled by error state
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

        // Fetch tier from backend API (works with both Firestore and file storage)
        fetch(`/api/user/usage?userId=${user.id}`)
            .then(res => res.json())
            .then(data => {
                setTier(data.tier || 'free');
                setSubscription({ tier: data.tier });
                setLoading(false);
            })
            .catch(err => {
                // Error fetching subscription - fallback to free tier
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
            // Error refreshing subscription - handled gracefully
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


export interface UseGlassProject {
    id: string;
    user_id: string;
    name: string;
    description?: string | null;
    notes?: string | null;
    metadata?: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

export interface UseGlassSavedOutput {
    id: string;
    user_id: string;
    project_id?: string | null;
    source_session_id?: string | null;
    output_type: 'text' | 'code' | 'document' | 'research' | 'builder' | 'agent';
    title: string;
    content: string;
    metadata?: Record<string, any> | null;
    created_at: string;
}

export interface UseGlassProjectItem {
    id: string;
    project_id: string;
    user_id: string;
    item_type: 'chat' | 'document' | 'builder_output' | 'code' | 'note' | 'saved_output';
    title: string;
    content?: string | null;
    reference_id?: string | null;
    metadata?: Record<string, any> | null;
    created_at: string;
}

export function useWorkspaceProjects() {
    const { user } = useUser();
    const [projects, setProjects] = useState<UseGlassProject[]>([]);
    const [savedOutputs, setSavedOutputs] = useState<UseGlassSavedOutput[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshWorkspace = useCallback(async () => {
        if (!user?.id) {
            setProjects([]);
            setSavedOutputs([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson<{ projects: UseGlassProject[]; savedOutputs: UseGlassSavedOutput[] }>(`/api/db/workspace?userId=${encodeURIComponent(user.id)}`);
            setProjects(data.projects || []);
            setSavedOutputs(data.savedOutputs || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load Firestore workspace');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        refreshWorkspace();
        if (!user?.id) return;
        const interval = window.setInterval(refreshWorkspace, 15000);
        return () => window.clearInterval(interval);
    }, [user?.id, refreshWorkspace]);

    const createProject = useCallback(async (name = 'Untitled Project', description = '') => {
        if (!user?.id) throw new Error('Sign in required');
        const data = await apiJson<UseGlassProject>('/api/db/projects', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id, name, description }),
        });
        await refreshWorkspace();
        return data;
    }, [user?.id, refreshWorkspace]);

    const saveOutput = useCallback(async (input: {
        projectId?: string | null;
        title: string;
        content: string;
        outputType?: UseGlassSavedOutput['output_type'];
        sourceSessionId?: string | null;
        metadata?: Record<string, any>;
    }) => {
        if (!user?.id) throw new Error('Sign in required');
        const data = await apiJson<UseGlassSavedOutput>('/api/db/outputs', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id, ...input }),
        });
        await refreshWorkspace();
        return data;
    }, [user?.id, refreshWorkspace]);

    return { projects, savedOutputs, loading, error, refreshWorkspace, createProject, saveOutput };
}

export function useProjectDetail(projectId?: string) {
    const { user } = useUser();
    const [project, setProject] = useState<UseGlassProject | null>(null);
    const [items, setItems] = useState<UseGlassProjectItem[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshProject = useCallback(async () => {
        if (!user?.id || !projectId) return;
        setLoading(true);
        const data = await apiJson<{ project: UseGlassProject | null; items: UseGlassProjectItem[] }>(`/api/db/projects/${projectId}?userId=${encodeURIComponent(user.id)}`);
        setProject(data.project || null);
        setItems(data.items || []);
        setLoading(false);
    }, [user?.id, projectId]);

    useEffect(() => { refreshProject(); }, [refreshProject]);

    const addNote = useCallback(async (content: string) => {
        if (!user?.id || !projectId || !content.trim()) return;
        await apiJson(`/api/db/projects/${projectId}/notes`, {
            method: 'POST',
            body: JSON.stringify({ userId: user.id, content }),
        });
        await refreshProject();
    }, [user?.id, projectId, refreshProject]);

    return { project, items, loading, refreshProject, addNote };
}
