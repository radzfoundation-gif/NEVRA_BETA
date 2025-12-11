-- QUICK FIX: Convert ai_usage.user_id from UUID to TEXT
-- Copy-paste ini ke Supabase SQL Editor dan jalankan

-- Step 1: Drop foreign key
ALTER TABLE public.ai_usage 
DROP CONSTRAINT IF EXISTS ai_usage_user_id_fkey;

-- Step 2: Convert column type
ALTER TABLE public.ai_usage 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Step 3: Recreate foreign key
ALTER TABLE public.ai_usage
ADD CONSTRAINT ai_usage_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Step 4: Fix RLS policies
DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;

CREATE POLICY "Users can view own usage" ON public.ai_usage
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own usage" ON public.ai_usage
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Done! ✅

