-- Fix user_id type mismatch for ai_usage table
-- Clerk user IDs are TEXT (format: user_xxx), not UUID
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. CHECK CURRENT TABLE STRUCTURE
-- =====================================================
-- First, check what type user_id currently is:
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'ai_usage'
    AND column_name = 'user_id';

-- =====================================================
-- 2. FIX: ALTER COLUMN TYPE (if needed)
-- =====================================================
-- If user_id is UUID, convert to TEXT to match Clerk IDs
-- WARNING: This will drop existing data if there's a type mismatch
-- Backup your data first!

-- Option A: If table is empty or you want to recreate
DROP TABLE IF EXISTS public.ai_usage CASCADE;

CREATE TABLE public.ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model TEXT,
    tokens_used INTEGER DEFAULT 10,
    cost_usd NUMERIC(10, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Option B: If table has data and user_id is UUID, convert it
-- (Only run this if you're sure users.id is also TEXT)
-- ALTER TABLE public.ai_usage 
-- ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- =====================================================
-- 3. RECREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_session_id ON public.ai_usage(session_id);

-- =====================================================
-- 4. ENABLE RLS
-- =====================================================
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. RECREATE RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;

CREATE POLICY "Users can view own usage" ON public.ai_usage
    FOR SELECT 
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own usage" ON public.ai_usage
    FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

-- =====================================================
-- 6. ENABLE REPLICATION
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_usage;

-- =====================================================
-- 7. VERIFY
-- =====================================================
-- Check column type
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'ai_usage'
    AND column_name = 'user_id';

-- Should show: data_type = 'text'





// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDAlq1kQBgQk3Vzfd5hh_KobDpG26iiU_4",
  authDomain: "nevra-c1ab9.firebaseapp.com",
  projectId: "nevra-c1ab9",
  storageBucket: "nevra-c1ab9.firebasestorage.app",
  messagingSenderId: "200586237080",
  appId: "1:200586237080:web:1df8786182199984b9aced",
  measurementId: "G-4DP8PNC7C1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);