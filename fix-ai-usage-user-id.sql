-- Fix ai_usage.user_id type from UUID to TEXT
-- Error: invalid input syntax for type uuid: "user_xxx"
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: CHECK CURRENT TYPE
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'ai_usage'
    AND column_name = 'user_id';

-- =====================================================
-- STEP 2: CHECK IF TABLE HAS DATA
-- =====================================================
SELECT COUNT(*) as row_count FROM public.ai_usage;

-- If row_count > 0, you may need to migrate data
-- If row_count = 0, safe to proceed

-- =====================================================
-- STEP 3: DROP FOREIGN KEY CONSTRAINT (temporary)
-- =====================================================
-- Get constraint name first
SELECT 
    conname AS constraint_name
FROM pg_constraint
WHERE conrelid = 'public.ai_usage'::regclass
    AND confrelid = 'public.users'::regclass
    AND contype = 'f';

-- Drop the foreign key (common names)
ALTER TABLE public.ai_usage 
DROP CONSTRAINT IF EXISTS ai_usage_user_id_fkey;

ALTER TABLE public.ai_usage 
DROP CONSTRAINT IF EXISTS ai_usage_user_id_fkey1;

-- =====================================================
-- STEP 4: CONVERT COLUMN TYPE
-- =====================================================
-- Convert user_id from UUID to TEXT
-- WARNING: This will fail if there's existing UUID data that can't be converted
-- If you have existing data, you need to migrate it first

-- Option A: If table is empty or you want to clear it
-- TRUNCATE TABLE public.ai_usage;

-- Option B: Convert type (will work if no data or if UUIDs can be converted)
ALTER TABLE public.ai_usage 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- =====================================================
-- STEP 4: RECREATE FOREIGN KEY
-- =====================================================
-- Add foreign key back (assuming users.id is TEXT)
ALTER TABLE public.ai_usage
ADD CONSTRAINT ai_usage_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- =====================================================
-- STEP 5: UPDATE RLS POLICIES
-- =====================================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;

-- Recreate with TEXT comparison
CREATE POLICY "Users can view own usage" ON public.ai_usage
    FOR SELECT 
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own usage" ON public.ai_usage
    FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

-- =====================================================
-- STEP 6: VERIFY
-- =====================================================
-- Check type is now TEXT
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'ai_usage'
    AND column_name = 'user_id';

-- Should show: data_type = 'text'

-- Test query (replace with your user_id)
-- SELECT * FROM public.ai_usage WHERE user_id = 'user_36aUWzGZ3wfC30vKNgnezhpx89j';

