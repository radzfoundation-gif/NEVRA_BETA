import { supabase, User, Subscription, ChatSession, Message, UserPreferences, TokenUsage, CanvasUsage, TIER_LIMITS } from './supabase';
import { getApiUrl } from './utils';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function tursoChatRequest<T>(path: string, userId?: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (userId) headers.set('x-user-id', userId);

    const apiBase = getApiUrl();
    const tursoBase = apiBase.endsWith('/api') ? `${apiBase}/turso` : `${apiBase}/api/turso`;
    const response = await fetch(`${tursoBase}${path}`, { ...init, headers });
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

// =====================================================
// USER FUNCTIONS
// =====================================================

/**
 * Sync user from Clerk to Supabase
 */
export async function syncUser(clerkUser: any): Promise<User | null> {
    try {
        const userData = {
            id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            full_name: clerkUser.fullName || null,
            avatar_url: clerkUser.imageUrl || null,
        };

        // Upsert user
        const { data, error } = await supabase
            .from('users')
            .upsert(userData, { onConflict: 'id' })
            .select()
            .maybeSingle();

        if (error) throw error;

        // Ensure subscription exists
        await ensureSubscription(clerkUser.id);

        return data;
    } catch (error: any) {
        // If error is 401/403/42501, it likely means missing/invalid Auth token or RLS policy.
        // We log this as a warning, not an error, to avoid spamming the console.
        if (error?.code === '401' || error?.status === 401 || error?.code === '42501') {
            
        } else {
            
        }
        return null;
    }
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        
        return null;
    }
}

// =====================================================
// SUBSCRIPTION FUNCTIONS
// =====================================================

/**
 * Ensure user has a subscription record
 */
export async function ensureSubscription(userId: string): Promise<Subscription | null> {
    try {
        // Check if subscription exists
        const { data: existing } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) return existing;

        // Create free subscription
        const { data, error } = await supabase
            .from('subscriptions')
            .insert({ user_id: userId, tier: 'free' })
            .select()
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        
        return null;
    }
}

/**
 * Get user subscription
 */
/**
 * Get user subscription
 */
export async function getSubscription(userId: string): Promise<any | null> {
    try {
        // CHANGED: Query centralized 'user_subscriptions' table
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (error) {
        
        return null;
    }
}

/**
 * Get user tier (with expiry check)
 */
export async function getUserTier(userId: string): Promise<'free' | 'pro'> {
    try {
        const subscription = await getSubscription(userId);
        if (!subscription) return 'free';

        // CHANGED: Logic for centralized table
        // Check if status is active and date is valid
        if (subscription.status === 'active' && subscription.valid_until) {
            const expiryDate = new Date(subscription.valid_until);
            if (expiryDate > new Date()) {
                return 'pro'; // Map 'researcher' or any active status to 'pro'
            }
        }

        return 'free';
    } catch (error) {
        
        return 'free';
    }
}

/**
 * Update subscription
 */
export async function updateSubscription(userId: string, updates: Partial<Subscription>): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('subscriptions')
            .update(updates)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        
        return false;
    }
}

/**
 * Activate Pro subscription
 */
export async function activateProSubscription(userId: string, orderId: string, months: number = 1): Promise<boolean> {
    try {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + months);

        const { error } = await supabase
            .from('subscriptions')
            .upsert({
                user_id: userId,
                tier: 'pro',
                activated_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
                midtrans_order_id: orderId
            }, { onConflict: 'user_id' });

        if (error) throw error;
        return true;
    } catch (error) {
        
        return false;
    }
}

// =====================================================
// CHAT SESSION FUNCTIONS
// =====================================================

/**
 * Create a new chat session
 */
export async function createChatSession(
    userId: string,
    mode: 'builder' | 'tutor' | 'canvas' | 'redesign' | 'logo',
    provider: string,
    title: string = 'New Chat'
): Promise<ChatSession | null> {
    try {
        localStorage.setItem('useglass-last-user-id', userId);
        return await tursoChatRequest<ChatSession>('/sessions', userId, {
            method: 'POST',
            body: JSON.stringify({ mode, provider, title })
        });
    } catch (error) {

        return null;
    }
}

/**
 * Get all chat sessions for a user
 */
export async function getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
        localStorage.setItem('useglass-last-user-id', userId);
        const { sessions } = await tursoChatRequest<{ sessions: ChatSession[] }>('/sessions', userId);
        return sessions || [];
    } catch (error) {

        return [];
    }
}

/**
 * Get a single chat session
 */
export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
        const userId = chatUserIdFromStorage();
        if (!userId) return null;
        return await tursoChatRequest<ChatSession>(`/sessions/${sessionId}`, userId);
    } catch (error) {

        return null;
    }
}

/**
 * Update chat session
 */
export async function updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<boolean> {
    try {
        const userId = chatUserIdFromStorage();
        if (!userId) return false;
        await tursoChatRequest<ChatSession>(`/sessions/${sessionId}`, userId, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
        return true;
    } catch (error) {

        return false;
    }
}

/**
 * Delete chat session and all its messages
 */
export async function deleteChatSession(sessionId: string): Promise<boolean> {
    try {
        const userId = chatUserIdFromStorage();
        if (!userId) return false;
        await tursoChatRequest(`/sessions/${sessionId}`, userId, { method: 'DELETE' });
        return true;
    } catch (error) {

        return false;
    }
}

/**
 * Share chat session (make public)
 */
export async function shareChatSession(sessionId: string): Promise<string | null> {
    try {
        const userId = chatUserIdFromStorage();
        if (!userId) return null;
        const { shareId } = await tursoChatRequest<{ shareId: string }>(`/sessions/${sessionId}/share`, userId, { method: 'POST' });
        return shareId;
    } catch (error) {

        return null;
    }
}

/**
 * Subscribe to user sessions (real-time)
 */
export function subscribeToUserSessions(
    userId: string,
    callback: (sessions: ChatSession[]) => void
) {
    // Initial fetch
    getUserSessions(userId).then(callback);

    const channelName = `sessions:${userId}`;

    // Remove any existing channel with the same name to prevent
    // "cannot add postgres_changes callbacks after subscribe()" error
    supabase.removeChannel(supabase.channel(channelName));

    // Subscribe to changes
    const subscription = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'chat_sessions',
                filter: `user_id=eq.${userId}`
            },
            () => {
                getUserSessions(userId).then(callback);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
}

// =====================================================
// MESSAGE FUNCTIONS
// =====================================================

/**
 * Save a message to a chat session
 */
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
        return await tursoChatRequest<Message>(`/sessions/${sessionId}/messages`, userId, {
            method: 'POST',
            body: JSON.stringify({ role, content, code: code || null, attachments: images || [] })
        });
    } catch (error) {

        return null;
    }
}

/**
 * Get messages for a chat session
 */
export async function getSessionMessages(sessionId: string): Promise<Message[]> {
    try {
        const userId = chatUserIdFromStorage();
        if (!userId) return [];
        const { messages } = await tursoChatRequest<{ messages: Message[] }>(`/sessions/${sessionId}/messages`, userId);
        return messages || [];
    } catch (error) {

        return [];
    }
}

// =====================================================
// TOKEN USAGE FUNCTIONS
// =====================================================

/**
 * Get token usage for current month
 */
export async function getTokenUsage(userId: string): Promise<TokenUsage | null> {
    const month = getCurrentMonth();

    try {
        const { data, error } = await supabase
            .from('token_usage')
            .select('*')
            .eq('user_id', userId)
            .eq('month', month)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (error) {
        
        return null;
    }
}

/**
 * Increment token usage
 */
export async function incrementTokenUsage(userId: string, amount: number): Promise<boolean> {
    const month = getCurrentMonth();

    try {
        // Try to update existing record
        const { data: existing } = await supabase
            .from('token_usage')
            .select('tokens_used')
            .eq('user_id', userId)
            .eq('month', month)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('token_usage')
                .update({ tokens_used: existing.tokens_used + amount })
                .eq('user_id', userId)
                .eq('month', month);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('token_usage')
                .insert({ user_id: userId, month, tokens_used: amount });
            if (error) throw error;
        }

        return true;
    } catch (error) {
        
        return false;
    }
}

/**
 * Check if user can use more tokens
 */
export async function canUseTokens(userId: string, amount: number): Promise<{ allowed: boolean; used: number; limit: number }> {
    const tier = await getUserTier(userId);
    const limit = TIER_LIMITS[tier].monthlyTokens;

    // Unlimited for pro
    if (limit < 0) {
        return { allowed: true, used: 0, limit: -1 };
    }

    const usage = await getTokenUsage(userId);
    const used = usage?.tokens_used || 0;

    return {
        allowed: used + amount <= limit,
        used,
        limit
    };
}

// =====================================================
// CANVAS USAGE FUNCTIONS
// =====================================================

/**
 * Get canvas usage for current month
 */
export async function getCanvasUsage(userId: string): Promise<CanvasUsage | null> {
    const month = getCurrentMonth();

    try {
        const { data, error } = await supabase
            .from('canvas_usage')
            .select('*')
            .eq('user_id', userId)
            .eq('month', month)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (error) {
        
        return null;
    }
}

/**
 * Increment canvas analyze count
 */
export async function incrementCanvasUsage(userId: string): Promise<boolean> {
    const month = getCurrentMonth();

    try {
        const { data: existing } = await supabase
            .from('canvas_usage')
            .select('analyze_count')
            .eq('user_id', userId)
            .eq('month', month)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('canvas_usage')
                .update({ analyze_count: existing.analyze_count + 1 })
                .eq('user_id', userId)
                .eq('month', month);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('canvas_usage')
                .insert({ user_id: userId, month, analyze_count: 1 });
            if (error) throw error;
        }

        return true;
    } catch (error) {
        
        return false;
    }
}

/**
 * Check if user can use canvas analyze
 */
export async function canUseCanvasAnalyze(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
    const tier = await getUserTier(userId);
    const limit = TIER_LIMITS[tier].monthlyCanvasAnalyzes;

    // Unlimited for pro
    if (limit < 0) {
        return { allowed: true, used: 0, limit: -1 };
    }

    const usage = await getCanvasUsage(userId);
    const used = usage?.analyze_count || 0;

    return {
        allowed: used < limit,
        used,
        limit
    };
}

// =====================================================
// USER PREFERENCES FUNCTIONS
// =====================================================

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (error) {
        
        return null;
    }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('user_preferences')
            .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' });

        if (error) throw error;
        return true;
    } catch (error) {
        
        return false;
    }
}

// =====================================================
// AI USAGE LOG
// =====================================================

/**
 * Log AI usage
 */
export async function logAIUsage(
    userId: string,
    sessionId: string | null,
    provider: string,
    model: string | null,
    tokensUsed: number,
    costUsd: number = 0
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('ai_usage_log')
            .insert({
                user_id: userId,
                session_id: sessionId,
                provider,
                model,
                tokens_used: tokensUsed,
                cost_usd: costUsd
            });

        if (error) throw error;

        // Also increment monthly token usage
        await incrementTokenUsage(userId, tokensUsed);

        return true;
    } catch (error) {
        
        return false;
    }
}

// =====================================================
// MODEL ACCESS CHECK
// =====================================================

/**
 * Check if user can access a specific model
 */
export async function canAccessModel(userId: string, provider: string): Promise<boolean> {
    const tier = await getUserTier(userId);
    const allowedModels = TIER_LIMITS[tier].allowedModels;
    return allowedModels.includes(provider);
}

// =====================================================
// STORAGE FUNCTIONS
// =====================================================

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
    bucket: string,
    path: string,
    file: File | Blob
): Promise<string | null> {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    } catch (error) {
        
        return null;
    }
}

/**
 * Update chat session metadata (e.g. for thumbnails)
 */
export async function updateChatSessionMetadata(sessionId: string, metadata: Record<string, any>): Promise<boolean> {
    return updateChatSession(sessionId, { metadata } as Partial<ChatSession>);
}

/**
 * Save user's preferred response from a dual-output generation
 */
export async function saveComparisonChoice(
    userId: string,
    sessionId: string,
    prompt: string,
    outputA: string,
    outputB: string,
    modelA: string,
    modelB: string,
    choice: 'a' | 'b'
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('prompt_comparisons')
            .insert({
                user_id: userId,
                session_id: sessionId,
                prompt,
                output_a: outputA,
                output_b: outputB,
                model_a: modelA,
                model_b: modelB,
                selected_version: choice
            });

        if (error) throw error;
        return true;
    } catch (error) {
        
        return false;
    }
}
