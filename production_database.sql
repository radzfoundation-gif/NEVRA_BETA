-- =====================================================================================
-- NOIR AI - PRODUCTION CONSOLIDATED DATABASE SCHEMA
-- =====================================================================================
-- This script contains all necessary tables, policies, and functions for production.
-- It combines core user profiles, chat sessions, knowledge base, and usage tracking.
-- =====================================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- Required for Knowledge Base RAG

-- 2. CORE TABLES

-- 2.1 USER PROFILES (Cloud Synced Settings)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    theme TEXT DEFAULT 'light',
    preferences JSONB DEFAULT '{}'::jsonb,
    tokens_remaining INTEGER NOT NULL DEFAULT 20,
    tokens_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 day',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 USER SKILLS (Custom AI Instructions)
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    is_custom BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 CHAT SESSIONS
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    mode TEXT NOT NULL DEFAULT 'builder' CHECK (mode IN ('builder', 'tutor', 'canvas', 'redesign', 'logo')),
    provider TEXT NOT NULL DEFAULT 'groq',
    metadata JSONB DEFAULT '{}'::jsonb,
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
    content TEXT NOT NULL,
    code TEXT,
    images JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 KNOWLEDGE BASE (Document RAG)
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    chunk_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 USAGE TRACKING
CREATE TABLE IF NOT EXISTS public.token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- Format: YYYY-MM_DD for daily or YYYY-MM for monthly
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- 2.7 USER SUBSCRIPTIONS (Billing & Tiers)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free',
    status TEXT DEFAULT 'inactive',
    valid_until TIMESTAMPTZ,
    stripe_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_user_id ON public.knowledge_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON public.knowledge_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4.1 Policies
CREATE POLICY "Manage own profile" ON public.user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Manage own skills" ON public.user_skills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own sessions" ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own messages" ON public.messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
);
CREATE POLICY "Manage own knowledge" ON public.knowledge_documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "View own usage" ON public.token_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "View own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- 5. FUNCTIONS & TRIGGERS

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_profile_time BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER tr_update_skills_time BEFORE UPDATE ON public.user_skills FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER tr_update_chat_time BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, theme, preferences)
    VALUES (NEW.id, 'light', '{}'::jsonb);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Search Knowledge Function
CREATE OR REPLACE FUNCTION search_knowledge(
    query_embedding vector(1536),
    target_user_id UUID,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    chunk_text TEXT,
    title TEXT,
    metadata JSONB,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kd.id,
        kd.chunk_text,
        kd.title,
        kd.metadata,
        1 - (kd.embedding <=> query_embedding) AS similarity
    FROM public.knowledge_documents kd
    WHERE kd.user_id = target_user_id
    ORDER BY kd.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. SECURITY DEFINER FUNCTIONS (Bypass RLS for specialized logic)
CREATE OR REPLACE FUNCTION get_user_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    sub RECORD;
BEGIN
    SELECT * INTO sub FROM public.user_subscriptions WHERE user_id = user_uuid;
    IF sub IS NULL OR sub.status != 'active' OR sub.valid_until < NOW() THEN
        RETURN 'free';
    END IF;
    RETURN sub.tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
