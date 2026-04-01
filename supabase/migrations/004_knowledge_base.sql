-- =====================================================
-- KNOWLEDGE BASE TABLE
-- Stores user document embeddings for RAG
-- =====================================================

CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    chunk_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL, -- text-embedding-3-small dimension
    chunk_index INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for vector similarity search (IVFFlat or HNSW)
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON public.knowledge_documents 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_knowledge_user_id ON public.knowledge_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_created_at ON public.knowledge_documents(created_at DESC);

-- RLS Policies
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
    ON public.knowledge_documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
    ON public.knowledge_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
    ON public.knowledge_documents FOR DELETE
    USING (auth.uid() = user_id);

-- Helper function to search knowledge base
CREATE OR REPLACE FUNCTION search_knowledge(
    query_embedding vector(1536),
    target_user_id UUID,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    chunk_text TEXT,
    title TEXT,
    metadata JSONB,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kd.id,
        kd.chunk_text,
        kd.title,
        kd.metadata,
        1 - (kd.embedding <=> query_embedding) AS similarity
    FROM public.knowledge_documents kd
    WHERE kd.user_id = target_user_id
    ORDER BY kd.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete all documents for a user (cleanup)
CREATE OR REPLACE FUNCTION delete_user_knowledge(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.knowledge_documents WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.knowledge_documents IS 'User document embeddings for RAG knowledge base';
