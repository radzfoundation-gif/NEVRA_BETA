import { supabase, User, Subscription, ChatSession, Message, UserPreferences, TokenUsage, CanvasUsage, TIER_LIMITS } from './supabase';

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
            console.warn('[Supabase] Sync failed (Auth/RLS). Ensure Clerk JWT template "supabase" is valid and RLS policies allow upsert.');
        } else {
            console.error('Error syncing user:', error);
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
        console.error('Error getting user:', error);
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
        console.error('Error ensuring subscription:', error);
        return null;
    }
}

/**
 * Get user subscription
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
    try {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (error) {
        console.error('Error getting subscription:', error);
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

        // Check if Pro has expired
        if (subscription.tier === 'pro' && subscription.expires_at) {
            const expiryDate = new Date(subscription.expires_at);
            if (expiryDate < new Date()) {
                // Expired, downgrade to free
                await updateSubscription(userId, { tier: 'free', expires_at: null });
                return 'free';
            }
        }

        return subscription.tier;
    } catch (error) {
        console.error('Error getting user tier:', error);
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
        console.error('Error updating subscription:', error);
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
        console.error('Error activating Pro subscription:', error);
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
        const { data, error } = await supabase
            .from('chat_sessions')
            .insert({ user_id: userId, mode, provider, title })
            .select()
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating chat session:', error);
        return null;
    }
}

/**
 * Get all chat sessions for a user
 */
export async function getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
        const tier = await getUserTier(userId);
        const historyDays = TIER_LIMITS[tier].chatHistoryDays;

        let query = supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        // Apply history limit for free tier
        if (historyDays > 0) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - historyDays);
            query = query.gte('created_at', cutoffDate.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting user sessions:', error);
        return [];
    }
}

/**
 * Get a single chat session
 */
export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting chat session:', error);
        return null;
    }
}

/**
 * Update chat session
 */
export async function updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('chat_sessions')
            .update(updates)
            .eq('id', sessionId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating chat session:', error);
        return false;
    }
}

/**
 * Delete chat session and all its messages
 */
export async function deleteChatSession(sessionId: string): Promise<boolean> {
    try {
        // Messages will be deleted via CASCADE
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting chat session:', error);
        return false;
    }
}

/**
 * Share chat session (make public)
 */
export async function shareChatSession(sessionId: string): Promise<string | null> {
    try {
        const { error } = await supabase
            .from('chat_sessions')
            .update({ is_shared: true })
            .eq('id', sessionId);

        if (error) throw error;

        return sessionId;
    } catch (error) {
        console.error('Error sharing chat session:', error);
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

    // Subscribe to changes
    const subscription = supabase
        .channel(`sessions:${userId}`)
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
        subscription.unsubscribe();
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
        const { data, error } = await supabase
            .from('messages')
            .insert({
                session_id: sessionId,
                role,
                content,
                code: code || null,
                images: images || null
            })
            .select()
            .maybeSingle();

        if (error) throw error;

        // Update session's updated_at
        await updateChatSession(sessionId, {});

        return data;
    } catch (error) {
        console.error('Error saving message:', error);
        return null;
    }
}

/**
 * Get messages for a chat session
 */
export async function getSessionMessages(sessionId: string): Promise<Message[]> {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting session messages:', error);
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
        console.error('Error getting token usage:', error);
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
        console.error('Error incrementing token usage:', error);
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
        console.error('Error getting canvas usage:', error);
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
        console.error('Error incrementing canvas usage:', error);
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
        console.error('Error getting user preferences:', error);
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
        console.error('Error updating user preferences:', error);
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
        console.error('Error logging AI usage:', error);
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
        console.error('Error uploading file:', error);
        return null;
    }
}

/**
 * Update chat session metadata (e.g. for thumbnails)
 */
export async function updateChatSessionMetadata(sessionId: string, metadata: Record<string, any>): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('chat_sessions')
            .update({ metadata })
            .eq('id', sessionId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating session metadata:', error);
        return false;
    }
}
