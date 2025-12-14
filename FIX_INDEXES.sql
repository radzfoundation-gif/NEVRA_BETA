-- Fix indexes and constraints for TEXT user_id
-- The error suggests indexes might still be expecting UUID

-- =====================================================
-- STEP 1: Drop all indexes on user_id columns
-- =====================================================
DROP INDEX IF EXISTS idx_chat_sessions_user_id;
DROP INDEX IF EXISTS idx_ai_usage_user_id;
DROP INDEX IF EXISTS idx_user_preferences_user_id;
DROP INDEX IF EXISTS idx_projects_user_id;

-- =====================================================
-- STEP 2: Recreate indexes for TEXT type
-- =====================================================
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_ai_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Create for projects if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id)';
    END IF;
END $$;

-- =====================================================
-- STEP 3: Verify column types one more time
-- =====================================================
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND column_name = 'user_id'
ORDER BY table_name;

-- All should show: data_type = 'text'

-- =====================================================
-- STEP 4: Test query manually
-- =====================================================
-- Try this query to see if it works:
-- SELECT * FROM public.chat_sessions WHERE user_id = 'user_36aNkMWAvGNnrBXuGLAmpFQetKf';

-- If this works, the issue is resolved!
