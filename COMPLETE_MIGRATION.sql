-- COMPLETE MIGRATION: Convert user_id from UUID to TEXT
-- This script handles ALL policies and constraints properly
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: DROP ALL POLICIES (COMPREHENSIVE)
-- =====================================================
-- We need to drop ALL policies that reference user_id before altering columns

-- Drop all policies on messages table
DROP POLICY IF EXISTS "Users can view messages in own sessions" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in own sessions" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in own sessions" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in own sessions" ON public.messages;

-- Drop all policies on chat_sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.chat_sessions;

-- Drop all policies on users
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Drop all policies on ai_usage
DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;

-- Drop all policies on user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

-- Drop all policies on projects (if exists)
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- Drop all policies on project_files (if exists)
DROP POLICY IF EXISTS "Users can view files in own projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can create files in own projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can update files in own projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can delete files in own projects" ON public.project_files;

-- =====================================================
-- STEP 2: DROP FOREIGN KEY CONSTRAINTS
-- =====================================================
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_session_id_fkey;
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;
ALTER TABLE public.ai_usage DROP CONSTRAINT IF EXISTS ai_usage_user_id_fkey;
ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- =====================================================
-- STEP 3: ALTER COLUMNS TO TEXT
-- =====================================================
-- Alter foreign key columns first
ALTER TABLE public.chat_sessions ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.ai_usage ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.user_preferences ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Alter these only if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        ALTER TABLE public.projects ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    END IF;
END $$;

-- Finally, alter the primary key
ALTER TABLE public.users ALTER COLUMN id TYPE TEXT USING id::text;

-- =====================================================
-- STEP 4: RECREATE FOREIGN KEY CONSTRAINTS
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

-- Recreate messages foreign key
ALTER TABLE public.messages
ADD CONSTRAINT messages_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES public.chat_sessions(id) 
ON DELETE CASCADE;

-- Recreate for optional tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        ALTER TABLE public.projects
        ADD CONSTRAINT projects_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- STEP 5: RECREATE RLS POLICIES
-- =====================================================

-- Users table policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Chat sessions policies
CREATE POLICY "Users can view own sessions" ON public.chat_sessions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own sessions" ON public.chat_sessions
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own sessions" ON public.chat_sessions
    FOR DELETE USING (auth.uid()::text = user_id);

-- Messages policies
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

-- AI usage policies
CREATE POLICY "Users can view own usage" ON public.ai_usage
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own usage" ON public.ai_usage
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid()::text = user_id);

-- =====================================================
-- STEP 6: VERIFY MIGRATION
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

-- ✅ Migration Complete!
-- You can now use Clerk user IDs (format: user_xxxxx) in your database
