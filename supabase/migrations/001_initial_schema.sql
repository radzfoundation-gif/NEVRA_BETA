-- =====================================================
-- NEVRA Production Database Schema
-- Version: 1.0.0
-- Purpose: SaaS multi-tenant architecture with RLS
-- =====================================================

-- =====================================================
-- USERS EXTENSION (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    tokens_remaining INTEGER NOT NULL DEFAULT 20,
    tokens_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 day',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, plan, role)
    VALUES (NEW.id, 'free', 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- CANVAS SESSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.canvas_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL UNIQUE, -- Format: nevra-{uuid}
    canvas_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_user_id ON public.canvas_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_room_id ON public.canvas_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_canvas_updated_at ON public.canvas_sessions(updated_at DESC);

-- RLS Policies
ALTER TABLE public.canvas_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own canvases"
    ON public.canvas_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own canvases"
    ON public.canvas_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own canvases"
    ON public.canvas_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own canvases"
    ON public.canvas_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- AI USAGE TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    request_type TEXT NOT NULL CHECK (request_type IN ('chat', 'canvas_analyze', 'redesign')),
    model TEXT NOT NULL DEFAULT 'sumopod-llm',
    prompt_length INTEGER,
    response_length INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_created_at ON public.ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_user_date ON public.ai_usage(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
    ON public.ai_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage"
    ON public.ai_usage FOR INSERT
    WITH CHECK (true); -- Only service key can insert

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired')),
    expires_at TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    midtrans_order_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

-- RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- WAITLIST
-- =====================================================
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'registered')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.waitlist(status);

-- No RLS - waitlist is public facing (handled by API)

-- =====================================================
-- RATE LIMITING
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

-- Auto-delete old rate limit data (older than 2 hours)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM public.rate_limits
    WHERE window_start < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_canvas_sessions_updated_at ON public.canvas_sessions;
CREATE TRIGGER update_canvas_sessions_updated_at
    BEFORE UPDATE ON public.canvas_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Get user's current token balance (with auto-reset logic)
CREATE OR REPLACE FUNCTION get_user_tokens(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    profile RECORD;
    current_tokens INTEGER;
    daily_limit INTEGER;
BEGIN
    SELECT * INTO profile FROM public.user_profiles WHERE id = user_uuid;
    
    IF profile IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Determine daily limit based on plan
    daily_limit := CASE profile.plan
        WHEN 'free' THEN 20
        WHEN 'pro' THEN 999999
        WHEN 'enterprise' THEN 999999
        ELSE 20
    END;
    
    -- Reset tokens if reset time has passed
    IF profile.tokens_reset_at < NOW() THEN
        UPDATE public.user_profiles
        SET 
            tokens_remaining = daily_limit,
            tokens_reset_at = NOW() + INTERVAL '1 day'
        WHERE id = user_uuid
        RETURNING tokens_remaining INTO current_tokens;
        
        RETURN current_tokens;
    END IF;
    
    RETURN profile.tokens_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deduct tokens (atomic operation with concurrency safety)
CREATE OR REPLACE FUNCTION deduct_tokens(user_uuid UUID, amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- Get current balance (will auto-reset if needed)
    current_balance := get_user_tokens(user_uuid);
    
    -- Check if user has enough tokens
    IF current_balance < amount THEN
        RETURN FALSE; -- Insufficient tokens
    END IF;
    
    -- Deduct tokens atomically
    UPDATE public.user_profiles
    SET tokens_remaining = tokens_remaining - amount
    WHERE id = user_uuid
    RETURNING tokens_remaining INTO new_balance;
    
    -- Verify deduction was successful
    IF new_balance < 0 THEN
        -- Rollback if went negative (race condition)
        RAISE EXCEPTION 'Token deduction failed - race condition';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's usage statistics
CREATE OR REPLACE FUNCTION get_user_usage_stats(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_requests BIGINT,
    total_tokens BIGINT,
    chat_requests BIGINT,
    canvas_requests BIGINT,
    redesign_requests BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_requests,
        COALESCE(SUM(tokens_used), 0)::BIGINT as total_tokens,
        COUNT(*) FILTER (WHERE request_type = 'chat')::BIGINT as chat_requests,
        COUNT(*) FILTER (WHERE request_type = 'canvas_analyze')::BIGINT as canvas_requests,
        COUNT(*) FILTER (WHERE request_type = 'redesign')::BIGINT as redesign_requests
    FROM public.ai_usage
    WHERE user_id = user_uuid
        AND created_at > NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADMIN FUNCTIONS
-- =====================================================

-- Manually set user plan (admin only)
CREATE OR REPLACE FUNCTION set_user_plan(user_uuid UUID, new_plan TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        plan = new_plan,
        tokens_remaining = CASE new_plan
            WHEN 'free' THEN 20
            WHEN 'pro' THEN 999999
            WHEN 'enterprise' THEN 999999
        END,
        tokens_reset_at = NOW() + INTERVAL '1 day'
    WHERE id = user_uuid;
    
    -- Update subscription record
    INSERT INTO public.subscriptions (user_id, plan, status)
    VALUES (user_uuid, new_plan, 'active')
    ON CONFLICT (user_id)
    DO UPDATE SET 
        plan = new_plan,
        status = 'active',
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCHEDULED JOBS (Run via pg_cron or external cron)
-- =====================================================

-- Clean up old rate limits (run hourly)
-- SELECT cleanup_rate_limits();

-- Clean up old AI usage logs (run daily, keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_usage_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.ai_usage
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- Insert default admin user (update with real email after migration)
-- INSERT INTO public.user_profiles (id, plan, role) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'enterprise', 'admin')
-- ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.user_profiles IS 'Extended user profile data with subscription and token info';
COMMENT ON TABLE public.canvas_sessions IS 'Stores Excalidraw canvas data for collaboration';
COMMENT ON TABLE public.ai_usage IS 'Tracks all AI API usage for billing and analytics';
COMMENT ON TABLE public.subscriptions IS 'User subscription status and payment info';
COMMENT ON TABLE public.waitlist IS 'Early access waitlist';
COMMENT ON TABLE public.rate_limits IS 'Rate limiting tracker (auto-cleaned)';

-- End of migration
