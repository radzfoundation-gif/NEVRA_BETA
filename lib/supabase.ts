// Turso-only compatibility module.
// Supabase client creation was removed so the app no longer requires VITE_SUPABASE_URL.

const unsupported = (feature: string) => {
    throw new Error(`${feature} is disabled. Use Turso API routes instead.`);
};

const emptyQuery: any = {
    select: () => emptyQuery,
    insert: () => emptyQuery,
    update: () => emptyQuery,
    delete: () => emptyQuery,
    upsert: () => emptyQuery,
    eq: () => emptyQuery,
    neq: () => emptyQuery,
    gte: () => emptyQuery,
    order: () => emptyQuery,
    limit: () => emptyQuery,
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any) => Promise.resolve(resolve({ data: [], error: null })),
};

const channel = {
    on: () => channel,
    subscribe: () => channel,
    unsubscribe: () => undefined,
};

export const supabase: any = {
    from: () => emptyQuery,
    rpc: async () => ({ data: null, error: null }),
    channel: () => channel,
    removeChannel: () => undefined,
    functions: { invoke: async () => ({ data: null, error: new Error('Supabase functions disabled') }) },
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
        signInWithPassword: async () => ({ data: null, error: null }),
        signUp: async () => ({ data: null, error: null }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async () => ({ data: null, error: null }),
        resetPasswordForEmail: async () => ({ data: null, error: null }),
        updateUser: async () => ({ data: { user: null }, error: null }),
        setSession: async () => ({ data: null, error: null }),
    },
};

export const setSupabaseToken = async (_token: string) => undefined;

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

export const TIER_LIMITS = {
    free: {
        monthlyTokens: 150,
        monthlyCanvasAnalyzes: 2,
        chatHistoryDays: 7,
        allowedModels: [
            'tencent/hy3-preview:free',
            'nvidia/nemotron-3-super-120b-a12b:free',
            'google/gemma-4-31b-it:free',
            'openai/gpt-oss-120b:free',
            'z-ai/glm-4.5-air:free',
        ] as string[],
    },
    pro: {
        monthlyTokens: -1,
        monthlyCanvasAnalyzes: -1,
        chatHistoryDays: -1,
        allowedModels: ['groq', 'openai', 'anthropic', 'gemini'],
    },
};

export default supabase;
