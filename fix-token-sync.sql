-- Fix Token Sync - Enable Real-time for ai_usage table
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. CREATE AI_USAGE TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model TEXT,
    tokens_used INTEGER DEFAULT 10,
    cost_usd NUMERIC(10, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_session_id ON public.ai_usage(session_id);

-- =====================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;

-- Create policies
-- Note: Using TEXT comparison because Clerk user IDs are strings (user_xxx format)
CREATE POLICY "Users can view own usage" ON public.ai_usage
    FOR SELECT 
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own usage" ON public.ai_usage
    FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

-- =====================================================
-- 4. ENABLE REPLICATION FOR REAL-TIME
-- =====================================================
-- This enables the table for real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_usage;

-- If the above fails, try this alternative:
-- CREATE PUBLICATION supabase_realtime FOR TABLE public.ai_usage;

-- =====================================================
-- 5. VERIFY SETUP
-- =====================================================
-- Check if table exists and has correct structure
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'ai_usage'
ORDER BY ordinal_position;

-- Check RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename = 'ai_usage';

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
WHERE tablename = 'ai_usage';

