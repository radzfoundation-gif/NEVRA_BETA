-- =====================================================
-- NOIR AI: Dual Response Comparison Table
-- =====================================================

CREATE TABLE IF NOT EXISTS prompt_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    output_a TEXT,
    output_b TEXT,
    model_a TEXT,
    model_b TEXT,
    selected_version TEXT CHECK (selected_version IN ('a', 'b')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE prompt_comparisons ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own comparisons
CREATE POLICY "Users can view own comparisons" ON prompt_comparisons
    FOR SELECT USING (auth.uid()::text = user_id);

-- Allow users to insert their own comparisons
CREATE POLICY "Users can insert own comparisons" ON prompt_comparisons
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_prompt_comparisons_user_id ON prompt_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comparisons_session_id ON prompt_comparisons(session_id);
