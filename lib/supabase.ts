import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials!');
    console.error('📝 Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file');
}

// Create Supabase client
export const supabase = createClient(
    SUPABASE_URL || '',
    SUPABASE_ANON_KEY || ''
);

/**
 * Set the Supabase Auth session using a custom token (e.g. from Clerk)
 */
export const setSupabaseToken = async (token: string) => {
    if (token) {
        await supabase.auth.setSession({
            access_token: token,
            refresh_token: '', // Clerk tokens don't come with a refresh token for Supabase
        });
    }
};

// =====================================================
// TypeScript Interfaces
// =====================================================

export interface User {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Subscription {
    id: string;
    user_id: string;
    tier: 'free' | 'pro';
    activated_at: string | null;
    expires_at: string | null;
    midtrans_order_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    mode: 'builder' | 'tutor' | 'canvas' | 'redesign' | 'logo';
    provider: string;
    created_at: string;
    updated_at: string;
    is_shared?: boolean;
    metadata?: Record<string, any>;
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
    default_provider: string;
    theme: string;
    preferences: Record<string, any>;
    updated_at: string;
}

export interface TokenUsage {
    id: string;
    user_id: string;
    month: string;
    tokens_used: number;
    created_at: string;
    updated_at: string;
}

export interface CanvasUsage {
    id: string;
    user_id: string;
    month: string;
    analyze_count: number;
    created_at: string;
    updated_at: string;
}

export interface TierLimits {
    tier: string;
    monthly_tokens: number;
    monthly_canvas_analyzes: number;
    chat_history_days: number;
    allowed_models: string[];
}

// =====================================================
// Tier Constants
// =====================================================

export const TIER_LIMITS = {
    free: {
        monthlyTokens: 150,
        monthlyCanvasAnalyzes: 2,
        chatHistoryDays: 7,
        allowedModels: ['groq']
    },
    pro: {
        monthlyTokens: -1, // Unlimited
        monthlyCanvasAnalyzes: -1, // Unlimited
        chatHistoryDays: -1, // Unlimited
        allowedModels: ['groq', 'openai', 'anthropic', 'gemini']
    }
};

export default supabase;
