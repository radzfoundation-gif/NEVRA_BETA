-- QUICK TEST: Disable RLS temporarily to confirm this is the issue
-- Run this first to test if chat history appears

ALTER TABLE public.chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences DISABLE ROW LEVEL SECURITY;

-- After running this, refresh your browser and test
-- If it works, then the issue is confirmed to be RLS policies

-- =====================================================
-- PERMANENT FIX: Update RLS policies to handle TEXT user_id
-- Run this AFTER confirming the test above works
-- =====================================================

-- First, re-enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.chat_sessions;

DROP POLICY IF EXISTS "Users can view messages in own sessions" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in own sessions" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in own sessions" ON public.messages;

DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

-- Recreate policies with proper TEXT casting
-- Chat sessions
CREATE POLICY "Users can view own sessions" ON public.chat_sessions
    FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE id = auth.uid()::text));

CREATE POLICY "Users can create own sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.users WHERE id = auth.uid()::text));

CREATE POLICY "Users can update own sessions" ON public.chat_sessions
    FOR UPDATE USING (user_id = (SELECT id FROM public.users WHERE id = auth.uid()::text));

CREATE POLICY "Users can delete own sessions" ON public.chat_sessions
    FOR DELETE USING (user_id = (SELECT id FROM public.users WHERE id = auth.uid()::text));

-- Messages (via chat_sessions)
CREATE POLICY "Users can view messages in own sessions" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = (SELECT id FROM public.users WHERE id = auth.uid()::text)
        )
    );

CREATE POLICY "Users can create messages in own sessions" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = (SELECT id FROM public.users WHERE id = auth.uid()::text)
        )
    );

CREATE POLICY "Users can delete messages in own sessions" ON public.messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = (SELECT id FROM public.users WHERE id = auth.uid()::text)
        )
    );

-- AI usage
CREATE POLICY "Users can view own usage" ON public.ai_usage
    FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE id = auth.uid()::text));

CREATE POLICY "Users can insert own usage" ON public.ai_usage
    FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.users WHERE id = auth.uid()::text));

-- User preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE id = auth.uid()::text));

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.users WHERE id = auth.uid()::text));

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (user_id = (SELECT id FROM public.users WHERE id = auth.uid()::text));

-- ✅ Done! RLS policies now properly handle TEXT user_id
