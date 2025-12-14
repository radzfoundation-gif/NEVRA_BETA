import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client (singleton to avoid multiple instances)
// Use module-level variable to ensure singleton across all imports
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseInstance() {
    // Check credentials only when instance is requested (lazy check)
    // This prevents top-level error that crashes the app before React can render
    if (!supabaseUrl || !supabaseAnonKey) {
        const isProduction = import.meta.env.PROD;
        const errorMessage = isProduction
            ? 'Missing Supabase credentials. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel environment variables. Go to: Vercel Dashboard → Project Settings → Environment Variables'
            : 'Missing Supabase credentials. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file';
        throw new Error(errorMessage);
    }

    if (!supabaseInstance) {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                storageKey: 'nevra-supabase-auth', // Unique storage key to avoid conflicts
            },
        });
    }
    return supabaseInstance;
}

// Lazy initialization using Proxy - only create instance when accessed
// This prevents top-level error that crashes the app before React can render
// Error will be thrown when supabase is actually used, allowing ErrorBoundary to catch it
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
    get(target, prop) {
        const instance = getSupabaseInstance();
        const value = instance[prop as keyof typeof instance];
        return typeof value === 'function' ? value.bind(instance) : value;
    }
});

export const createAuthenticatedClient = (token: string) => {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase credentials. Cannot create authenticated client.');
    }
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });
};

// Database Types
export interface User {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    mode: 'builder' | 'tutor';
    provider: 'anthropic' | 'deepseek' | 'openai' | 'gemini';
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    session_id: string;
    role: 'user' | 'ai';
    content: string;
    code: string | null;
    images: string[] | null;
    created_at: string;
}

export interface UserPreferences {
    user_id: string;
    default_provider: 'groq' | 'gemini' | 'openai';
    theme: string;
    preferences: Record<string, any>;
    updated_at: string;
}
