-- =====================================================================================
-- NEVRA FULL DATABASE SETUP SCRIPT
-- =====================================================================================
-- This script sets up the entire database schema for Nevra, including:
-- 1. Extensions (UUID)
-- 2. Tables (Users, Subscriptions, Chat, Redesigns, etc.)
-- 3. Indexes for performance
-- 4. Triggers for auto-updating timestamps
-- 5. Row Level Security (RLS) Policies for data protection
-- 
-- INSTRUCTIONS:
-- Copy specific sections or the whole script into your Supabase SQL Editor and run it.
-- =====================================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- 2. TABLE DEFINITIONS
-- =====================================================================================

-- 2.1 USERS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,  -- Clerk user ID (string)
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2.2 SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    midtrans_order_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- 2.3 CHAT SESSIONS
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    mode TEXT NOT NULL DEFAULT 'builder' CHECK (mode IN ('builder', 'tutor', 'canvas')),
    provider TEXT NOT NULL DEFAULT 'groq',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);

-- 2.4 MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
    content TEXT NOT NULL,
    code TEXT,
    images JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);

-- 2.5 USER PREFERENCES
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_provider TEXT DEFAULT 'groq',
    theme TEXT DEFAULT 'light',
    preferences JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.6 REDESIGNS (Design & Clone Mode History)
CREATE TABLE IF NOT EXISTS redesigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- References users(id) via RLS, foreign key optional but recommended
    prompt TEXT NOT NULL,
    type TEXT DEFAULT 'html', -- 'html' or 'image'
    content TEXT, -- HTML content or Image URL
    image_data TEXT, -- Base64 storage (nullable)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_redesigns_user_id ON redesigns(user_id);

-- 2.7 USER API KEYS (BYOK)
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('groq', 'deepseek', 'openai', 'openai_image', 'kimi')),
    api_key_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    auto_route_for TEXT[], 
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- 2.8 USAGE TRACKING (Tokens & Canvas)
CREATE TABLE IF NOT EXISTS token_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- YYYY-MM
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month)
);
CREATE TABLE IF NOT EXISTS canvas_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    analyze_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month)
);
CREATE TABLE IF NOT EXISTS ai_usage_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model TEXT,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.9 TIER LIMITS (Reference)
CREATE TABLE IF NOT EXISTS tier_limits (
    tier TEXT PRIMARY KEY,
    monthly_tokens INTEGER,
    monthly_canvas_analyzes INTEGER,
    chat_history_days INTEGER,
    allowed_models JSONB
);
-- Insert Default Tiers
INSERT INTO tier_limits (tier, monthly_tokens, monthly_canvas_analyzes, chat_history_days, allowed_models) 
VALUES 
('free', 150, 2, 7, '["groq"]'),
('pro', -1, -1, -1, '["groq", "openai", "anthropic", "gemini", "deepseek"]')
ON CONFLICT (tier) DO NOTHING;

-- 2.10 LEARNING FEATURES (Flashcards, Notes, Memories)
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_name TEXT NOT NULL DEFAULT 'General',
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    difficulty INTEGER DEFAULT 0,
    next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL DEFAULT 'general',
    content JSONB NOT NULL,
    importance INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    referral_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
CREATE TABLE IF NOT EXISTS learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    progress_percent INTEGER DEFAULT 0,
    milestones JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, topic)
);

-- =====================================================================================
-- 3. TRIGGERS (Auto-update updated_at)
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_token_usage_updated_at ON token_usage;
CREATE TRIGGER update_token_usage_updated_at BEFORE UPDATE ON token_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_canvas_usage_updated_at ON canvas_usage;
CREATE TRIGGER update_canvas_usage_updated_at BEFORE UPDATE ON canvas_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_flashcards_updated_at ON flashcards;
CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON user_api_keys;
CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON user_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================================================
-- 4. ROW LEVEL SECURITY (RLS) policies
-- =====================================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE redesigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- 4.1 USERS
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = id);

-- 4.2 SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can create own subscription" ON subscriptions;
CREATE POLICY "Users can create own subscription" ON subscriptions FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 4.3 CHAT SESSIONS
DROP POLICY IF EXISTS "Users can manage own sessions" ON chat_sessions;
CREATE POLICY "Users can manage own sessions" ON chat_sessions FOR ALL USING (auth.uid()::text = user_id);

-- 4.4 MESSAGES
DROP POLICY IF EXISTS "Users can manage own messages" ON messages;
CREATE POLICY "Users can manage own messages" ON messages FOR ALL USING (
    EXISTS (SELECT 1 FROM chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()::text)
);

-- 4.5 REDESIGNS
DROP POLICY IF EXISTS "Users can view own redesigns" ON redesigns;
CREATE POLICY "Users can view own redesigns" ON redesigns FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own redesigns" ON redesigns;
CREATE POLICY "Users can insert own redesigns" ON redesigns FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own redesigns" ON redesigns;
CREATE POLICY "Users can delete own redesigns" ON redesigns FOR DELETE USING (auth.uid()::text = user_id);

-- 4.6 USER API KEYS
DROP POLICY IF EXISTS "Users can manage own api keys" ON user_api_keys;
CREATE POLICY "Users can manage own api keys" ON user_api_keys FOR ALL USING (auth.uid()::text = user_id);

-- 4.7 USER PREFERENCES
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid()::text = user_id);

-- 4.8 USAGE & LEARNING (Simplified per-user policies)
CREATE POLICY "Users can view own token usage" ON token_usage FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own canvas usage" ON canvas_usage FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own ai logs" ON ai_usage_log FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage own flashcards" ON flashcards FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage own notes" ON notes FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage own memories" ON user_memories FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid()::text = referrer_id);
CREATE POLICY "Users can manage own learning progress" ON learning_progress FOR ALL USING (auth.uid()::text = user_id);

-- 4.9 PUBLIC INFO
DROP POLICY IF EXISTS "Everyone can view tier limits" ON tier_limits;
CREATE POLICY "Everyone can view tier limits" ON tier_limits FOR SELECT USING (true);
