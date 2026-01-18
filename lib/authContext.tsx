import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

// =====================================================
// Types (Clerk-compatible API)
// =====================================================

interface ClerkCompatibleUser {
    id: string;
    emailAddresses: { emailAddress: string }[];
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    primaryEmailAddress?: { emailAddress: string };
    nickname: string | null;
}

interface AuthContextType {
    // Clerk-compatible properties
    user: ClerkCompatibleUser | null;
    isLoaded: boolean;
    isSignedIn: boolean;

    // Supabase-specific (useful for direct access)
    supabaseUser: User | null;
    session: Session | null;

    // Actions
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
    updateProfile: (data: { nickname?: string; fullName?: string }) => Promise<{ error: Error | null }>;
}

// =====================================================
// Context
// =====================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =====================================================
// Provider
// =====================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Convert Supabase User to Clerk-compatible format
    const toClerkUser = (user: User | null): ClerkCompatibleUser | null => {
        if (!user) return null;

        const email = user.email || '';
        const metadata = user.user_metadata || {};

        return {
            id: user.id,
            emailAddresses: [{ emailAddress: email }],
            fullName: metadata.full_name || metadata.name || null,
            firstName: metadata.first_name || (metadata.full_name?.split(' ')[0]) || null,
            lastName: metadata.last_name || (metadata.full_name?.split(' ').slice(1).join(' ')) || null,
            imageUrl: metadata.avatar_url || metadata.picture || null,
            primaryEmailAddress: { emailAddress: email },
            nickname: metadata.nickname || null,
        };
    };

    // Initialize auth state
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setSupabaseUser(session?.user ?? null);
            setIsLoaded(true);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session) {
                    setSession(session);
                    setSupabaseUser(session.user);
                    setIsLoaded(true);

                    // Clean up URL (remove # and auth params)
                    const url = new URL(window.location.href);
                    if (url.hash && url.hash === '#') {
                        window.history.replaceState(null, '', ' ');
                    }
                } else {
                    setSession(null);
                    setSupabaseUser(null);
                    setIsLoaded(true);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Sign in with email/password
    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? new Error(error.message) : null };
    }, []);

    // Sign up with email/password
    const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName || '',
                }
            }
        });
        return { error: error ? new Error(error.message) : null };
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
    }, []);

    // Sign in with Google OAuth
    const signInWithGoogle = useCallback(async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
            }
        });
    }, []);

    // Reset password
    const resetPassword = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error: error ? new Error(error.message) : null };
    }, []);

    const updateProfile = useCallback(async (data: { nickname?: string; fullName?: string }) => {
        const updates: any = {};
        if (data.nickname) updates.nickname = data.nickname;
        if (data.fullName) updates.full_name = data.fullName;

        const { data: { user }, error } = await supabase.auth.updateUser({
            data: updates
        });

        if (user) {
            setSupabaseUser(user);
        }

        return { error: error ? new Error(error.message) : null };
    }, []);

    const value: AuthContextType = {
        user: toClerkUser(supabaseUser),
        isLoaded,
        isSignedIn: !!supabaseUser,
        supabaseUser,
        session,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPassword,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// =====================================================
// Hooks (Clerk-compatible API)
// =====================================================

/**
 * useUser - Clerk-compatible hook
 * Returns { user, isLoaded, isSignedIn }
 */
export function useUser() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useUser must be used within an AuthProvider');
    }
    return {
        user: context.user,
        isLoaded: context.isLoaded,
        isSignedIn: context.isSignedIn,
    };
}

/**
 * useAuth - Clerk-compatible hook
 * Returns { isLoaded, isSignedIn, signIn, signOut, signUp }
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return {
        isLoaded: context.isLoaded,
        isSignedIn: context.isSignedIn,
        signIn: context.signIn,
        signOut: context.signOut,
        signUp: context.signUp,
        signInWithGoogle: context.signInWithGoogle,
        resetPassword: context.resetPassword,
        updateProfile: context.updateProfile,
    };
}

/**
 * useSession - Get raw Supabase session
 */
export function useSession() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useSession must be used within an AuthProvider');
    }
    return {
        session: context.session,
        isLoaded: context.isLoaded,
    };
}

export default AuthProvider;
