-- =====================================================
-- NEVRA Database Schema (Bolt.new Style)
-- Enhanced schema for full AI code generation tracking
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,  -- Synced with Clerk user ID (String)
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- PROJECTS TABLE (Bolt.new style)
-- Each chat session can have multiple projects/apps
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID,  -- Link to chat session (nullable for standalone projects)
    title TEXT NOT NULL,
    description TEXT,
    template TEXT,  -- 'react', 'vue', 'vanilla', 'node', etc.
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    preview_url TEXT,  -- URL for live preview
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_session_id ON projects(session_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- =====================================================
-- PROJECT FILES TABLE
-- Stores all files in a project (like bolt.new)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,  -- e.g., 'src/App.tsx', 'package.json'
    content TEXT NOT NULL,
    language TEXT,  -- 'typescript', 'javascript', 'css', 'html', etc.
    size_bytes INTEGER,
    is_binary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, file_path)
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_path ON project_files(file_path);

-- =====================================================
-- CHAT SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('builder', 'tutor')),
    provider TEXT NOT NULL CHECK (provider IN ('groq', 'grok', 'deepseek', 'openai', 'gemini')),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,  -- Link to active project
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_id ON chat_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_provider ON chat_sessions(provider);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_mode ON chat_sessions(mode);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_mode_provider ON chat_sessions(user_id, mode, provider);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
    content TEXT NOT NULL,
    code TEXT,  -- Generated code snippet
    images JSONB,  -- Array of image URLs/base64
    files_modified JSONB,  -- Array of file paths that were modified
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- =====================================================
-- TERMINAL LOGS TABLE (Bolt.new feature)
-- Stores terminal output from build/dev commands
-- =====================================================
CREATE TABLE IF NOT EXISTS terminal_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    command TEXT NOT NULL,  -- e.g., 'npm install', 'npm run dev'
    output TEXT,
    exit_code INTEGER,
    status TEXT CHECK (status IN ('running', 'success', 'error')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_terminal_logs_project_id ON terminal_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_terminal_logs_started_at ON terminal_logs(started_at DESC);

-- =====================================================
-- PREVIEW SNAPSHOTS TABLE
-- Store preview states for time-travel debugging
-- =====================================================
CREATE TABLE IF NOT EXISTS preview_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    snapshot_name TEXT,
    files_snapshot JSONB NOT NULL,  -- Complete file tree at this point
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preview_snapshots_project_id ON preview_snapshots(project_id);

-- =====================================================
-- USER PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_provider TEXT DEFAULT 'groq' CHECK (default_provider IN ('groq', 'grok', 'deepseek', 'openai', 'gemini')),
    default_template TEXT DEFAULT 'react',
    theme TEXT DEFAULT 'dark',
    editor_settings JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AI USAGE TRACKING TABLE
-- Track API usage per user for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model TEXT,
    tokens_used INTEGER CHECK (tokens_used >= 0),
    cost_usd DECIMAL(10, 6) CHECK (cost_usd >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_session_id ON ai_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_daily ON ai_usage(user_id, provider, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE preview_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Project files policies
CREATE POLICY "Users can view files in own projects" ON project_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_files.project_id
            AND projects.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create files in own projects" ON project_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_files.project_id
            AND projects.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update files in own projects" ON project_files
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_files.project_id
            AND projects.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete files in own projects" ON project_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_files.project_id
            AND projects.user_id::text = auth.uid()::text
        )
    );

-- Chat sessions policies
CREATE POLICY "Users can view own sessions" ON chat_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own sessions" ON chat_sessions
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Messages policies
CREATE POLICY "Users can view messages in own sessions" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create messages in own sessions" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update messages in own sessions" ON messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete messages in own sessions" ON messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id::text = auth.uid()::text
        )
    );

-- Terminal logs policies
CREATE POLICY "Users can view logs in own projects" ON terminal_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = terminal_logs.project_id
            AND projects.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create logs in own projects" ON terminal_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = terminal_logs.project_id
            AND projects.user_id::text = auth.uid()::text
        )
    );

-- Preview snapshots policies
CREATE POLICY "Users can view snapshots in own projects" ON preview_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = preview_snapshots.project_id
            AND projects.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create snapshots in own projects" ON preview_snapshots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = preview_snapshots.project_id
            AND projects.user_id::text = auth.uid()::text
        )
    );

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- AI usage policies
CREATE POLICY "Users can view own usage" ON ai_usage
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own usage" ON ai_usage
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_files_updated_at
    BEFORE UPDATE ON project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-update project size
CREATE OR REPLACE FUNCTION update_project_file_size()
RETURNS TRIGGER AS $$
BEGIN
    NEW.size_bytes = LENGTH(NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_file_size_on_insert
    BEFORE INSERT ON project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_project_file_size();

CREATE TRIGGER update_file_size_on_update
    BEFORE UPDATE ON project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_project_file_size();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View: User project statistics
CREATE OR REPLACE VIEW user_project_stats AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT cs.id) as total_sessions,
    COUNT(DISTINCT m.id) as total_messages,
    SUM(au.tokens_used) as total_tokens_used,
    SUM(au.cost_usd) as total_cost_usd
FROM users u
LEFT JOIN projects p ON p.user_id = u.id
LEFT JOIN chat_sessions cs ON cs.user_id = u.id
LEFT JOIN messages m ON m.session_id = cs.id
LEFT JOIN ai_usage au ON au.user_id = u.id
GROUP BY u.id, u.email;

-- View: Recent activity
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    'message' as activity_type,
    m.id,
    cs.user_id,
    cs.title as context,
    m.content as description,
    m.created_at
FROM messages m
JOIN chat_sessions cs ON cs.id = m.session_id
UNION ALL
SELECT 
    'project' as activity_type,
    p.id,
    p.user_id,
    p.title as context,
    p.description,
    p.created_at
FROM projects p
ORDER BY created_at DESC
LIMIT 100;

-- =====================================================
-- ENABLE REAL-TIME REPLICATION
-- =====================================================

-- Enable real-time for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS user_preferences;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS projects;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS project_files;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS ai_usage;

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- You can add seed data here if needed
