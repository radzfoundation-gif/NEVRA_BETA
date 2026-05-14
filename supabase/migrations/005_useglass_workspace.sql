-- UseGlass AI workspace additions
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

UPDATE public.chat_sessions
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  description TEXT,
  notes TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('chat', 'document', 'builder_output', 'code', 'note', 'saved_output')),
  title TEXT NOT NULL DEFAULT 'Untitled Item',
  content TEXT,
  reference_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  file_name TEXT,
  mime_type TEXT,
  content TEXT,
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  source_session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  output_type TEXT NOT NULL DEFAULT 'text' CHECK (output_type IN ('text', 'code', 'document', 'research', 'builder', 'agent')),
  title TEXT NOT NULL DEFAULT 'Saved Output',
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_useglass_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_useglass_project_items_project_id ON public.project_items(project_id);
CREATE INDEX IF NOT EXISTS idx_useglass_project_items_user_id ON public.project_items(user_id);
CREATE INDEX IF NOT EXISTS idx_useglass_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_useglass_saved_outputs_user_id ON public.saved_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_useglass_saved_outputs_project_id ON public.saved_outputs(project_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_outputs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_owner_all') THEN
    CREATE POLICY projects_owner_all ON public.projects
      FOR ALL USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_items' AND policyname = 'project_items_owner_all') THEN
    CREATE POLICY project_items_owner_all ON public.project_items
      FOR ALL USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'documents_owner_all') THEN
    CREATE POLICY documents_owner_all ON public.documents
      FOR ALL USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saved_outputs' AND policyname = 'saved_outputs_owner_all') THEN
    CREATE POLICY saved_outputs_owner_all ON public.saved_outputs
      FOR ALL USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
