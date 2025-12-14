-- FINAL MIGRATION: Convert user_id from UUID to TEXT
-- This script drops EVERYTHING that depends on user_id before altering
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: DROP ALL VIEWS
-- =====================================================
DROP VIEW IF EXISTS public.recent_activity CASCADE;
DROP VIEW IF EXISTS public.user_stats CASCADE;
DROP VIEW IF EXISTS public.user_usage_stats CASCADE;
DROP VIEW IF EXISTS public.user_project_stats CASCADE;

-- =====================================================
-- STEP 2: DROP ALL POLICIES
-- =====================================================
-- Messages
DROP POLICY IF EXISTS "Users can view messages in own sessions" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in own sessions" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in own sessions" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in own sessions" ON public.messages;

-- Chat sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.chat_sessions;

-- Users
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- AI usage
DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;

-- User preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

-- Projects (if exists)
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- =====================================================
-- STEP 3: DROP FOREIGN KEY CONSTRAINTS
-- =====================================================
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_session_id_fkey;
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;
ALTER TABLE public.ai_usage DROP CONSTRAINT IF EXISTS ai_usage_user_id_fkey;
ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- Drop projects constraint if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        EXECUTE 'ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey';
    END IF;
END $$;

-- =====================================================
-- STEP 4: ALTER COLUMNS TO TEXT
-- =====================================================
-- Alter foreign key columns first
ALTER TABLE public.chat_sessions ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.ai_usage ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.user_preferences ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Alter projects if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        ALTER TABLE public.projects ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    END IF;
END $$;

-- Finally, alter the primary key
ALTER TABLE public.users ALTER COLUMN id TYPE TEXT USING id::text;

-- =====================================================
-- STEP 5: RECREATE FOREIGN KEY CONSTRAINTS
-- =====================================================
ALTER TABLE public.chat_sessions
ADD CONSTRAINT chat_sessions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.ai_usage
ADD CONSTRAINT ai_usage_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.user_preferences
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.messages
ADD CONSTRAINT messages_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES public.chat_sessions(id) 
ON DELETE CASCADE;

-- Recreate projects constraint if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        EXECUTE 'ALTER TABLE public.projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE';
    END IF;
END $$;

-- =====================================================
-- STEP 6: RECREATE RLS POLICIES
-- =====================================================

-- Users table
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Chat sessions
CREATE POLICY "Users can view own sessions" ON public.chat_sessions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own sessions" ON public.chat_sessions
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own sessions" ON public.chat_sessions
    FOR DELETE USING (auth.uid()::text = user_id);

-- Messages
CREATE POLICY "Users can view messages in own sessions" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create messages in own sessions" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete messages in own sessions" ON public.messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = auth.uid()::text
        )
    );

-- AI usage
CREATE POLICY "Users can view own usage" ON public.ai_usage
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own usage" ON public.ai_usage
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- User preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid()::text = user_id);

-- =====================================================
-- STEP 7: RECREATE VIEWS
-- =====================================================
CREATE OR REPLACE VIEW public.recent_activity AS
SELECT 
    'message' as activity_type,
    m.id,
    cs.user_id,
    cs.title as context,
    m.content as description,
    m.created_at
FROM public.messages m
JOIN public.chat_sessions cs ON cs.id = m.session_id
UNION ALL
SELECT 
    'session' as activity_type,
    cs.id,
    cs.user_id,
    cs.title as context,
    cs.mode as description,
    cs.created_at
FROM public.chat_sessions cs
ORDER BY created_at DESC
LIMIT 100;

-- =====================================================
-- STEP 8: VERIFY MIGRATION
-- =====================================================
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND (
        (table_name = 'users' AND column_name = 'id')
        OR (table_name = 'chat_sessions' AND column_name = 'user_id')
        OR (table_name = 'ai_usage' AND column_name = 'user_id')
        OR (table_name = 'user_preferences' AND column_name = 'user_id')
    )
ORDER BY table_name, column_name;

-- All should show: data_type = 'text'

-- ✅ MIGRATION COMPLETE!
-- Your database now supports Clerk user IDs (format: user_xxxxx)
