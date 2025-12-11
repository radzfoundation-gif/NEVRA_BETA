-- =====================================================
-- USER API KEYS TABLE
-- Store user's own API keys for unified management
-- =====================================================
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('groq', 'deepseek', 'openai', 'openai_image', 'kimi')),
    api_key_encrypted TEXT NOT NULL, -- Encrypted API key
    is_active BOOLEAN DEFAULT true,
    auto_route_for TEXT[], -- Array of task types: ['image', 'text', 'code', 'voice']
    priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 100), -- Higher priority = used first
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own API keys" ON user_api_keys
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own API keys" ON user_api_keys
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own API keys" ON user_api_keys
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own API keys" ON user_api_keys
    FOR DELETE USING (auth.uid()::text = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_api_keys_timestamp
    BEFORE UPDATE ON user_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_user_api_keys_updated_at();
