import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase credentials. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file'
    );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

export const createAuthenticatedClient = (token: string) => {
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
    provider: 'groq' | 'deepseek' | 'openai';
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
