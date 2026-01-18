-- =====================================================
-- NEVRA SECURITY HARDENING SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR
-- =====================================================

-- 1. Enable Row Level Security (RLS) on all public tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS canvas_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referrals ENABLE ROW LEVEL SECURITY;

-- 2. Define RLS Policies
-- We drop existing policies first to avoid "Warning: policy already exists" errors

-- Users: Users can view and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Subscriptions: Users can view their own subscription
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can create own subscription" ON subscriptions;
CREATE POLICY "Users can create own subscription" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Chat Sessions: Users can CRUD their own sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON chat_sessions;
CREATE POLICY "Users can view own sessions" ON chat_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can create own sessions" ON chat_sessions;
CREATE POLICY "Users can create own sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON chat_sessions;
CREATE POLICY "Users can update own sessions" ON chat_sessions
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own sessions" ON chat_sessions;
CREATE POLICY "Users can delete own sessions" ON chat_sessions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Messages: Access based on session ownership
DROP POLICY IF EXISTS "Users can view messages in own sessions" ON messages;
CREATE POLICY "Users can view messages in own sessions" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can insert messages in own sessions" ON messages;
CREATE POLICY "Users can insert messages in own sessions" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()::text)
  );

-- User Preferences: Users can CRUD their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Usage Tables: Users can view, Service role manages inserts (usually)
DROP POLICY IF EXISTS "Users can view own token usage" ON token_usage;
CREATE POLICY "Users can view own token usage" ON token_usage
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own canvas usage" ON canvas_usage;
CREATE POLICY "Users can view own canvas usage" ON canvas_usage
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own ai logs" ON ai_usage_log;
CREATE POLICY "Users can view own ai logs" ON ai_usage_log
  FOR SELECT USING (auth.uid()::text = user_id);

-- Learning Tables: Users can CRUD their own data
DROP POLICY IF EXISTS "Users can view own flashcards" ON flashcards;
CREATE POLICY "Users can view own flashcards" ON flashcards
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can manage own flashcards" ON flashcards;
CREATE POLICY "Users can manage own flashcards" ON flashcards
  FOR ALL USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own notes" ON notes;
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can manage own notes" ON notes;
CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own learning progress" ON learning_progress;
CREATE POLICY "Users can view own learning progress" ON learning_progress
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can manage own learning progress" ON learning_progress;
CREATE POLICY "Users can manage own learning progress" ON learning_progress
  FOR ALL USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own memories" ON user_memories;
CREATE POLICY "Users can view own memories" ON user_memories
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can manage own memories" ON user_memories;
CREATE POLICY "Users can manage own memories" ON user_memories
  FOR ALL USING (auth.uid()::text = user_id);

-- Referrals: Users can view referrals where they are the referrer
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid()::text = referrer_id);

-- 3. Secure Functions
ALTER TABLE IF EXISTS tier_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view tier limits" ON tier_limits;
CREATE POLICY "Everyone can view tier limits" ON tier_limits
  FOR SELECT USING (true);

-- Done.
