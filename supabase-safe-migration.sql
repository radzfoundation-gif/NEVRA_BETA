-- =====================================================
-- NOIR AI SAFE MIGRATION (Non-Destructive)
-- Adds Projects and Documents tables
-- Adapts to existing TEXT user_id from Clerk
-- =====================================================
-- =====================================================
-- 0. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "vector"; -- Required for embedding
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Projects Table (Grouping for Chats)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- 2. Create Documents Table (For RAG/Knowledge)
-- Using vector extension (assumed enabled from previous schema)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    embedding VECTOR(1536), -- Open AI / Standard embedding size
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for vector search (IVFFlat for speed, or HNSW if available)
-- Note: 'vector_cosine_ops' requires pgvector
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);

-- 3. Modify Chat Sessions (Add project association)
-- SAFE OPERATION: Adding nullable column does not break existing rows
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_id ON chat_sessions(project_id);

-- 4. Triggers for Updated At
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
