-- =====================================================
-- SHARE CHAT FEATURE MIGRATION
-- =====================================================

-- 1. Add is_shared column to chat_sessions
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_sessions') THEN
        ALTER TABLE public.chat_sessions 
        ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Update RLS Policies for chat_sessions
-- Allow anyone to view sessions where is_shared is true
DROP POLICY IF EXISTS "Public can view shared sessions" ON public.chat_sessions;
CREATE POLICY "Public can view shared sessions"
    ON public.chat_sessions FOR SELECT
    USING (is_shared = true);

-- 3. Update RLS Policies for messages
-- Allow anyone to view messages belonging to a shared session
DROP POLICY IF EXISTS "Public can view shared messages" ON public.messages;
CREATE POLICY "Public can view shared messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.chat_sessions 
            WHERE id = messages.session_id 
            AND is_shared = true
        )
    );
