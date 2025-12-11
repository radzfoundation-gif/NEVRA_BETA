-- QUICK FIX: Convert ai_usage.user_id from UUID to TEXT
-- Run this if migration didn't complete or ai_usage table wasn't migrated
-- This is a focused fix just for ai_usage table

-- =====================================================
-- STEP 1: CHECK CURRENT TYPE
-- =====================================================
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'ai_usage'
    AND column_name = 'user_id';

-- If this shows 'uuid', continue with the fix below
-- If this shows 'text', the issue is elsewhere

-- =====================================================
-- STEP 2: DROP DEPENDENCIES
-- =====================================================
-- Drop policies first
DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;

-- Drop foreign key
ALTER TABLE public.ai_usage 
DROP CONSTRAINT IF EXISTS ai_usage_user_id_fkey;

-- =====================================================
-- STEP 3: CONVERT COLUMN TYPE
-- =====================================================
ALTER TABLE public.ai_usage 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- =====================================================
-- STEP 4: RECREATE DEPENDENCIES
-- =====================================================
-- Recreate foreign key
ALTER TABLE public.ai_usage
ADD CONSTRAINT ai_usage_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Recreate policies
CREATE POLICY "Users can view own usage" ON public.ai_usage
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own usage" ON public.ai_usage
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- =====================================================
-- STEP 5: ENABLE REPLICATION (if needed)
-- =====================================================
-- Only add if not already in publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'ai_usage'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_usage;
    END IF;
END $$;

-- =====================================================
-- STEP 6: VERIFY
-- =====================================================
-- Check type (should be 'text' now)
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'ai_usage'
    AND column_name = 'user_id';

-- Test query (should work without error)
SELECT * FROM public.ai_usage 
WHERE user_id = 'user_36aUWzGZ3wfC30vKNgnezhpx89j';

-- ✅ Fix Complete!

