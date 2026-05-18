import { getApiUrl } from './utils';

export interface User {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Subscription {
    id?: string;
    user_id: string;
    tier: 'free' | 'pro';
    status?: string;
    valid_until?: string | null;
    activated_at?: string | null;
    expires_at?: string | null;
    midtrans_order_id?: string | null;
    created_at?: string;
    updated_at?: string;
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
    id?: string;
    user_id: string;
    month: string;
    tokens_used: number;
    created_at?: string;
    updated_at?: string;
}

export interface CanvasUsage {
    id?: string;
    user_id: string;
    month: string;
    analyze_count: number;
    created_at?: string;
    updated_at?: string;
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

export function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function dbRequest<T>(path: string, userId?: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (userId) headers.set('x-user-id', userId);

    const apiBase = getApiUrl();
    const dbBase = apiBase.endsWith('/api') ? `${apiBase}/db` : `${apiBase}/api/db`;
    const response = await fetch(`${dbBase}${path}`, { ...init, headers });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
}

function chatUserIdFromStorage(): string | null {
    try {
        return localStorage.getItem('useglass-last-user-id');
    } catch {
        return null;
    }
}

export async function syncUser(clerkUser: any): Promise<User | null> {
    if (!clerkUser?.id) return null;
    const now = new Date().toISOString();
    return {
        id: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
        full_name: clerkUser.fullName || null,
        avatar_url: clerkUser.imageUrl || null,
        created_at: now,
        updated_at: now,
    };
}

export async function getUser(userId: string): Promise<User | null> {
    if (!userId) return null;
    const now = new Date().toISOString();
    return { id: userId, email: '', full_name: null, avatar_url: null, created_at: now, updated_at: now };
}

export async function ensureSubscription(userId: string): Promise<Subscription | null> {
    return getSubscription(userId);
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
    try {
        const usage = await dbRequest<{ tier: 'free' | 'pro' }>(`/credits?userId=${encodeURIComponent(userId)}`, userId);
        return { user_id: userId, tier: usage.tier || 'free' };
    } catch {
        return { user_id: userId, tier: 'free' };
    }
}

export async function getUserTier(userId: string): Promise<'free' | 'pro'> {
    const subscription = await getSubscription(userId);
    return subscription?.tier === 'pro' ? 'pro' : 'free';
}

export async function updateSubscription(_userId: string, _updates: Partial<Subscription>): Promise<boolean> {
    return true;
}

export async function activateProSubscription(_userId: string, _orderId: string, _months: number = 1): Promise<boolean> {
    return true;
}

export async function createChatSession(
    userId: string,
    mode: 'builder' | 'tutor' | 'canvas' | 'redesign' | 'logo',
    provider: string,
    title: string = 'New Chat'
): Promise<ChatSession | null> {
    try {
        localStorage.setItem('useglass-last-user-id', userId);
        return await dbRequest<ChatSession>('/sessions', userId, {
            method: 'POST',
            body: JSON.stringify({ userId, mode, provider, title })
        });
    } catch {
        return null;
    }
}

export async function getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
        localStorage.setItem('useglass-last-user-id', userId);
        const { sessions } = await dbRequest<{ sessions: ChatSession[] }>(`/sessions?userId=${encodeURIComponent(userId)}`, userId);
        return sessions || [];
    } catch {
        return [];
    }
}

export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
        const userId = chatUserIdFromStorage();
        if (!userId) return null;
        return await dbRequest<ChatSession>(`/sessions/${sessionId}?userId=${encodeURIComponent(userId)}`, userId);
    } catch {
        return null;
    }
}

export async function updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<boolean> {
    try {
        const userId = chatUserIdFromStorage();
        if (!userId) return false;
        await dbRequest<ChatSession>(`/sessions/${sessionId}`, userId, {
            method: 'PATCH',
            body: JSON.stringify({ userId, ...updates })
        });
        return true;
    } catch {
        return false;
    }
}

export async function deleteChatSession(sessionId: string): Promise<boolean> {
    try {
        const userId = chatUserIdFromStorage();
        if (!userId) return false;
        await dbRequest(`/sessions/${sessionId}?userId=${encodeURIComponent(userId)}`, userId, { method: 'DELETE' });
        return true;
    } catch {
        return false;
    }
}

export async function shareChatSession(sessionId: string): Promise<string | null> {
    try {
        const userId = chatUserIdFromStorage();
        if (!userId) return null;
        const { shareId } = await dbRequest<{ shareId: string }>(`/sessions/${sessionId}/share`, userId, {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
        return shareId;
    } catch {
        return null;
    }
}

export function subscribeToUserSessions(userId: string, callback: (sessions: ChatSession[]) => void) {
    let active = true;
    const load = () => getUserSessions(userId).then((sessions) => {
        if (active) callback(sessions);
    });
    load();
    const interval = window.setInterval(load, 10000);
    return () => {
        active = false;
        window.clearInterval(interval);
    };
}

export async function saveMessage(
    sessionId: string,
    role: 'user' | 'ai',
    content: string,
    code?: string,
    images?: string[]
): Promise<Message | null> {
    try {
        const userId = chatUserIdFromStorage();
        if (!userId) return null;
        return await dbRequest<Message>(`/sessions/${sessionId}/messages`, userId, {
            method: 'POST',
            body: JSON.stringify({ userId, role, content, code: code || null, attachments: images || [] })
        });
    } catch {
        return null;
    }
}

export async function getSessionMessages(sessionId: string): Promise<Message[]> {
    try {
        const userId = chatUserIdFromStorage();
        if (!userId) return [];
        const { messages } = await dbRequest<{ messages: Message[] }>(`/sessions/${sessionId}/messages?userId=${encodeURIComponent(userId)}`, userId);
        return messages || [];
    } catch {
        return [];
    }
}

export async function getTokenUsage(userId: string): Promise<TokenUsage | null> {
    try {
        const usage = await dbRequest<{ used: number }>(`/credits?userId=${encodeURIComponent(userId)}`, userId);
        return { user_id: userId, month: getCurrentMonth(), tokens_used: usage.used || 0 };
    } catch {
        return null;
    }
}

export async function incrementTokenUsage(userId: string, amount: number): Promise<boolean> {
    try {
        await dbRequest('/credits/increment', userId, {
            method: 'POST',
            body: JSON.stringify({ userId, amount }),
        });
        return true;
    } catch {
        return false;
    }
}

export async function canUseTokens(userId: string, amount: number): Promise<{ allowed: boolean; used: number; limit: number }> {
    const tier = await getUserTier(userId);
    const limit = TIER_LIMITS[tier].monthlyTokens;
    if (limit < 0) return { allowed: true, used: 0, limit: -1 };
    const usage = await getTokenUsage(userId);
    const used = usage?.tokens_used || 0;
    return { allowed: used + amount <= limit, used, limit };
}

export async function getCanvasUsage(userId: string): Promise<CanvasUsage | null> {
    return { user_id: userId, month: getCurrentMonth(), analyze_count: 0 };
}

export async function incrementCanvasUsage(_userId: string): Promise<boolean> {
    return true;
}

export async function canUseCanvasAnalyze(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
    const tier = await getUserTier(userId);
    const limit = TIER_LIMITS[tier].monthlyCanvasAnalyzes;
    return { allowed: limit < 0 || 0 < limit, used: 0, limit };
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return {
        user_id: userId,
        default_provider: 'auto',
        theme: 'dark',
        preferences: {},
        updated_at: new Date().toISOString(),
    };
}

export async function updateUserPreferences(_userId: string, _updates: Partial<UserPreferences>): Promise<boolean> {
    return true;
}

export async function logAIUsage(userId: string, _sessionId: string | null, _provider: string, _model: string | null, tokensUsed: number): Promise<boolean> {
    return incrementTokenUsage(userId, tokensUsed);
}

export async function canAccessModel(userId: string, provider: string): Promise<boolean> {
    const tier = await getUserTier(userId);
    return TIER_LIMITS[tier].allowedModels.includes(provider);
}

export async function uploadFile(_bucket: string, _path: string, _file: File | Blob): Promise<string | null> {
    return null;
}

export async function updateChatSessionMetadata(sessionId: string, metadata: Record<string, any>): Promise<boolean> {
    return updateChatSession(sessionId, { metadata } as Partial<ChatSession>);
}

export async function saveComparisonChoice(_userId: string, _sessionId: string, _prompt: string, _outputA: string, _outputB: string, _modelA: string, _modelB: string, _choice: 'a' | 'b'): Promise<boolean> {
    return true;
}
