-- =====================================================
-- NEVRA Database Fixes - SAFE VERSION
-- Fixes issues without breaking existing data
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. FIX PROVIDER CONSTRAINT (chat_sessions)
-- Add missing providers: 'grok', 'deepseek'
-- =====================================================

-- Drop old constraint (safe - only removes constraint, not data)
-- Only if table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_sessions'
    ) THEN
        ALTER TABLE chat_sessions 
        DROP CONSTRAINT IF EXISTS chat_sessions_provider_check;

        -- Add new constraint with all supported providers
        ALTER TABLE chat_sessions
        ADD CONSTRAINT chat_sessions_provider_check 
        CHECK (provider IN ('groq', 'grok', 'deepseek', 'openai', 'gemini'));
    ELSE
        RAISE NOTICE 'Skipping chat_sessions provider constraint: table does not exist.';
    END IF;
END $$;

-- =====================================================
-- 2. FIX PROVIDER CONSTRAINT (user_preferences)
-- Add missing providers
-- =====================================================

-- Drop old constraint
-- Only if table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_preferences'
    ) THEN
        ALTER TABLE user_preferences 
        DROP CONSTRAINT IF EXISTS user_preferences_default_provider_check;

        -- Add new constraint
        ALTER TABLE user_preferences
        ADD CONSTRAINT user_preferences_default_provider_check 
        CHECK (default_provider IN ('groq', 'grok', 'deepseek', 'openai', 'gemini'));
    ELSE
        RAISE NOTICE 'Skipping user_preferences provider constraint: table does not exist.';
    END IF;
END $$;

-- =====================================================
-- 3. ADD MISSING INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for filtering by provider in chat_sessions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_sessions'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_provider ON chat_sessions(provider);
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_mode ON chat_sessions(mode);
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_mode_provider 
        ON chat_sessions(user_id, mode, provider);
    END IF;
END $$;

-- Indexes for ai_usage
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_usage'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage(provider);
        CREATE INDEX IF NOT EXISTS idx_ai_usage_session_id ON ai_usage(session_id);
        CREATE INDEX IF NOT EXISTS idx_ai_usage_daily 
        ON ai_usage(user_id, provider, created_at DESC);
    END IF;
END $$;

-- =====================================================
-- 4. ADD UPDATE POLICY FOR MESSAGES
-- Allow users to update their own messages
-- =====================================================

-- Drop if exists (safe - prevents duplicate)
-- Only if table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
    ) THEN
        DROP POLICY IF EXISTS "Users can update messages in own sessions" ON messages;

        -- Create UPDATE policy
        CREATE POLICY "Users can update messages in own sessions" ON messages
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM chat_sessions
                    WHERE chat_sessions.id = messages.session_id
                    AND chat_sessions.user_id::text = auth.uid()::text
                )
            );
    ELSE
        RAISE NOTICE 'Skipping messages UPDATE policy: table does not exist.';
    END IF;
END $$;

-- =====================================================
-- 5. ADD VALIDATION CONSTRAINTS (SAFE - Only if no violating data)
-- =====================================================

-- Check if there's any negative tokens_used before adding constraint
DO $$
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_usage'
    ) THEN
        -- Only add constraint if no negative values exist
        IF NOT EXISTS (
            SELECT 1 FROM ai_usage WHERE tokens_used < 0
        ) THEN
            -- Drop constraint if exists (safe)
            ALTER TABLE ai_usage 
            DROP CONSTRAINT IF EXISTS tokens_used_positive;
            
            -- Add constraint
            ALTER TABLE ai_usage 
            ADD CONSTRAINT tokens_used_positive CHECK (tokens_used >= 0);
        ELSE
            RAISE NOTICE 'Skipping tokens_used constraint: negative values exist. Fix data first.';
        END IF;
    ELSE
        RAISE NOTICE 'Skipping tokens_used constraint: ai_usage table does not exist.';
    END IF;
END $$;

-- Check if there's any negative cost before adding constraint
DO $$
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_usage'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM ai_usage WHERE cost_usd < 0
        ) THEN
            -- Drop constraint if exists (safe)
            ALTER TABLE ai_usage 
            DROP CONSTRAINT IF EXISTS cost_positive;
            
            -- Add constraint
            ALTER TABLE ai_usage 
            ADD CONSTRAINT cost_positive CHECK (cost_usd >= 0);
        ELSE
            RAISE NOTICE 'Skipping cost_usd constraint: negative values exist. Fix data first.';
        END IF;
    ELSE
        RAISE NOTICE 'Skipping cost_usd constraint: ai_usage table does not exist.';
    END IF;
END $$;

-- Priority range constraint (safe - default is 0, so should be fine)
-- Only add if table exists
DO $$
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_api_keys'
    ) THEN
        -- Check if there's any invalid priority before adding constraint
        IF NOT EXISTS (
            SELECT 1 FROM user_api_keys WHERE priority < 0 OR priority > 100
        ) THEN
            -- Drop constraint if exists (safe)
            ALTER TABLE user_api_keys 
            DROP CONSTRAINT IF EXISTS priority_range;
            
            -- Add constraint
            ALTER TABLE user_api_keys 
            ADD CONSTRAINT priority_range CHECK (priority >= 0 AND priority <= 100);
        ELSE
            RAISE NOTICE 'Skipping priority constraint: values outside range exist. Fix data first.';
        END IF;
    ELSE
        RAISE NOTICE 'Skipping priority constraint: user_api_keys table does not exist.';
    END IF;
END $$;

-- =====================================================
-- 6. ENABLE REAL-TIME REPLICATION
-- Add tables to real-time publication (safe - idempotent)
-- =====================================================

-- Enable real-time for chat_sessions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'chat_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;
    END IF;
END $$;

-- Enable real-time for messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;
END $$;

-- Enable real-time for user_preferences
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'user_preferences'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_preferences;
    END IF;
END $$;

-- Enable real-time for projects
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'projects'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE projects;
    END IF;
END $$;

-- Enable real-time for project_files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'project_files'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE project_files;
    END IF;
END $$;

-- =====================================================
-- 7. VERIFY FIXES
-- =====================================================

-- Check constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'chat_sessions'::regclass
    AND conname LIKE '%provider%';

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('chat_sessions', 'ai_usage', 'messages')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'messages'
    AND policyname LIKE '%update%';

-- Check real-time tables
SELECT 
    pubname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- =====================================================
-- DONE! ✅
-- All fixes applied safely without breaking existing data
-- =====================================================
