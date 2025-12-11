-- SAFE MIGRATION: Convert user_id from UUID to TEXT (preserve all data)
-- This script converts users.id and all related foreign keys from UUID to TEXT
-- Run this in Supabase SQL Editor
--
-- IMPORTANT NOTES:
-- 1. This preserves all existing data by converting UUID to TEXT (UUID string format)
-- 2. Existing UUIDs will become TEXT (e.g., '550e8400-e29b-41d4-a716-446655440000')
-- 3. New Clerk user IDs will be in format 'user_xxx'
-- 4. Both formats will work as TEXT, but you may need to update existing user records
--    to match Clerk IDs if you're syncing from Clerk
--
-- If you have existing users with UUID IDs and want to sync with Clerk:
-- You'll need to update users.id to match Clerk user IDs after this migration

-- =====================================================
-- STEP 1: BACKUP CHECK (Optional but recommended)
-- =====================================================
-- Check current data counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM public.users
UNION ALL
SELECT 'ai_usage', COUNT(*) FROM public.ai_usage
UNION ALL
SELECT 'chat_sessions', COUNT(*) FROM public.chat_sessions
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM public.user_preferences;

-- =====================================================
-- STEP 2: DROP VIEWS AND RULES THAT DEPEND ON user_id
-- =====================================================
-- Views and rules must be dropped BEFORE altering columns

-- Drop views that might use user_id
-- CASCADE will also drop dependent objects
DROP VIEW IF EXISTS public.user_project_stats CASCADE;
DROP VIEW IF EXISTS public.user_usage_stats CASCADE;
DROP VIEW IF EXISTS public.user_stats CASCADE;
DROP VIEW IF EXISTS public.recent_activity CASCADE;

-- Find and drop any other views that use user_id
-- Run find-views-using-user-id.sql first to see all views
-- Then add DROP VIEW statements here for any additional views found

-- =====================================================
-- STEP 3: DROP ALL RLS POLICIES
-- =====================================================
-- Policies must be dropped BEFORE altering columns

-- Drop policies on ai_usage
DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;

-- Drop policies on chat_sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.chat_sessions;

-- Drop policies on projects
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- Drop policies on user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

-- Drop policies on messages (these reference chat_sessions.user_id)
DROP POLICY IF EXISTS "Users can view messages in own sessions" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in own sessions" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in own sessions" ON public.messages;

-- Drop policies on project_files (these reference projects.user_id)
DROP POLICY IF EXISTS "Users can view files in own projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can create files in own projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can update files in own projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can delete files in own projects" ON public.project_files;

-- Drop policies on terminal_logs (these reference projects.user_id)
DROP POLICY IF EXISTS "Users can view logs in own projects" ON public.terminal_logs;
DROP POLICY IF EXISTS "Users can create logs in own projects" ON public.terminal_logs;

-- Drop policies on preview_snapshots (these reference projects.user_id)
DROP POLICY IF EXISTS "Users can view snapshots in own projects" ON public.preview_snapshots;
DROP POLICY IF EXISTS "Users can create snapshots in own projects" ON public.preview_snapshots;

-- Drop policies on users
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- =====================================================
-- STEP 4: DROP ALL FOREIGN KEY CONSTRAINTS
-- =====================================================
-- Drop foreign keys that reference users.id
ALTER TABLE public.ai_usage 
DROP CONSTRAINT IF EXISTS ai_usage_user_id_fkey;

ALTER TABLE public.chat_sessions 
DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;

ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

ALTER TABLE public.user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- =====================================================
-- STEP 5: CONVERT COLUMNS (in correct order)
-- =====================================================
-- First, convert all foreign key columns
ALTER TABLE public.ai_usage 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE public.chat_sessions 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE public.projects 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE public.user_preferences 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Then, convert the primary key (users.id)
-- This is safe because we already converted all foreign keys
ALTER TABLE public.users 
ALTER COLUMN id TYPE TEXT USING id::text;

-- =====================================================
-- STEP 6: RECREATE FOREIGN KEY CONSTRAINTS
-- =====================================================
ALTER TABLE public.ai_usage
ADD CONSTRAINT ai_usage_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.chat_sessions
ADD CONSTRAINT chat_sessions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.projects
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.user_preferences
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- =====================================================
-- STEP 7: RECREATE RLS POLICIES
-- =====================================================
-- Recreate policies with TEXT comparison (already dropped in Step 2)
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can view own usage" ON public.ai_usage
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own usage" ON public.ai_usage
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view own sessions" ON public.chat_sessions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own sessions" ON public.chat_sessions
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own sessions" ON public.chat_sessions
    FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid()::text = user_id);

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

-- =====================================================
-- STEP 8: RECREATE VIEWS (if they existed)
-- =====================================================
-- Recreate views that were dropped in Step 2
-- Uncomment and modify if you had these views:

-- Example: user_project_stats view
-- CREATE VIEW public.user_project_stats AS
-- SELECT 
--     u.id as user_id,
--     u.email,
--     COUNT(DISTINCT p.id) as project_count,
--     COUNT(DISTINCT cs.id) as session_count
-- FROM public.users u
-- LEFT JOIN public.projects p ON u.id = p.user_id
-- LEFT JOIN public.chat_sessions cs ON u.id = cs.user_id
-- GROUP BY u.id, u.email;

-- Recreate recent_activity view
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
    'project' as activity_type,
    p.id,
    p.user_id,
    p.title as context,
    p.description,
    p.created_at
FROM public.projects p
ORDER BY created_at DESC
LIMIT 100;

-- =====================================================
-- STEP 9: ENABLE REPLICATION FOR REAL-TIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_usage;

-- =====================================================
-- STEP 10: VERIFY MIGRATION
-- =====================================================
-- Check all columns are now TEXT
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND (
        (table_name = 'users' AND column_name = 'id')
        OR (table_name = 'ai_usage' AND column_name = 'user_id')
        OR (table_name = 'chat_sessions' AND column_name = 'user_id')
        OR (table_name = 'projects' AND column_name = 'user_id')
        OR (table_name = 'user_preferences' AND column_name = 'user_id')
    )
ORDER BY table_name, column_name;

-- All should show: data_type = 'text'

-- Verify data is still there
SELECT 'users' as table_name, COUNT(*) as row_count FROM public.users
UNION ALL
SELECT 'ai_usage', COUNT(*) FROM public.ai_usage
UNION ALL
SELECT 'chat_sessions', COUNT(*) FROM public.chat_sessions
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM public.user_preferences;

-- Counts should be the same as Step 1

-- ✅ Migration Complete!

