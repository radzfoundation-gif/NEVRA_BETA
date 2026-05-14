-- UseGlass AI Omni database additions
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE public.saved_outputs
  DROP CONSTRAINT IF EXISTS saved_outputs_output_type_check;

ALTER TABLE public.project_items
  DROP CONSTRAINT IF EXISTS project_items_item_type_check;

ALTER TABLE public.saved_outputs
  ADD CONSTRAINT saved_outputs_output_type_check
  CHECK (output_type IN ('text', 'chat', 'code', 'document', 'research', 'builder', 'builder_output', 'canvas', 'workflow', 'skill_output', 'connector_output', 'note', 'presentation', 'web', 'pdf', 'agent'));

ALTER TABLE public.project_items
  ADD CONSTRAINT project_items_item_type_check
  CHECK (item_type IN ('chat', 'document', 'builder_output', 'code', 'note', 'saved_output', 'research', 'canvas', 'workflow', 'skill_output', 'connector_output', 'presentation', 'web', 'pdf'));

CREATE TABLE IF NOT EXISTS public.canvas_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  canvas_type TEXT NOT NULL DEFAULT 'document' CHECK (canvas_type IN ('document', 'web', 'code', 'presentation', 'general')),
  title TEXT NOT NULL DEFAULT 'Untitled Canvas',
  content TEXT NOT NULL DEFAULT '',
  content_format TEXT DEFAULT 'markdown',
  source_prompt TEXT,
  source_tool TEXT,
  source_workflow TEXT,
  source_style TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('closed', 'opening', 'active', 'fullscreen', 'collapsed', 'error')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.canvas_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES public.canvas_documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.routing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  message_id UUID,
  prompt TEXT NOT NULL DEFAULT '',
  detected_intent TEXT,
  selected_tool TEXT,
  selected_workflow TEXT,
  selected_style TEXT,
  selected_skill TEXT,
  selected_connector TEXT,
  canvas_type TEXT,
  output_format TEXT,
  confidence NUMERIC(4, 3),
  reason TEXT,
  auto_pilot BOOLEAN NOT NULL DEFAULT true,
  override BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  skill_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  description TEXT,
  category TEXT,
  instructions TEXT,
  example_prompts JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, skill_key)
);

CREATE TABLE IF NOT EXISTS public.user_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  style_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  description TEXT,
  tone TEXT,
  formatting_preference TEXT,
  do_rules JSONB DEFAULT '[]'::jsonb,
  avoid_rules JSONB DEFAULT '[]'::jsonb,
  example_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, style_key)
);

CREATE TABLE IF NOT EXISTS public.user_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  connector_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'coming_soon', 'error')),
  capabilities JSONB DEFAULT '[]'::jsonb,
  credentials JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, connector_key)
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id TEXT PRIMARY KEY,
  auto_pilot BOOLEAN NOT NULL DEFAULT true,
  default_tool TEXT DEFAULT 'chat',
  default_workflow TEXT DEFAULT 'think',
  default_style TEXT DEFAULT 'normal',
  default_model TEXT DEFAULT 'sonnet',
  ui_theme TEXT DEFAULT 'light',
  sidebar_state TEXT DEFAULT 'expanded',
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  goal TEXT NOT NULL DEFAULT '',
  tool TEXT,
  workflow_mode TEXT,
  style TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  plan JSONB DEFAULT '[]'::jsonb,
  result TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  step_index INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL DEFAULT 'Step',
  tool TEXT,
  workflow_mode TEXT,
  style TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  input TEXT DEFAULT '',
  output TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  original_prompt TEXT NOT NULL DEFAULT '',
  improved_prompt TEXT,
  tool TEXT,
  workflow_mode TEXT,
  style TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  message_id UUID,
  attachment_type TEXT NOT NULL DEFAULT 'file',
  name TEXT NOT NULL DEFAULT 'Attachment',
  mime_type TEXT,
  size BIGINT NOT NULL DEFAULT 0,
  url TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  export_format TEXT NOT NULL DEFAULT 'pdf',
  title TEXT NOT NULL DEFAULT 'Export',
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  event_type TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.glass_tools (
  tool_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workflow_modes (
  mode_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  internal_flow TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.skill_catalog (
  skill_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  instructions TEXT,
  example_prompts JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.style_catalog (
  style_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tone TEXT,
  formatting_preference TEXT,
  do_rules JSONB DEFAULT '[]'::jsonb,
  avoid_rules JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.connector_catalog (
  connector_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  default_status TEXT NOT NULL DEFAULT 'disconnected' CHECK (default_status IN ('connected', 'disconnected', 'coming_soon', 'error')),
  capabilities JSONB DEFAULT '[]'::jsonb,
  permission_summary TEXT,
  example_prompts JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.glass_tools (tool_key, name, description, icon, sort_order) VALUES
  ('chat', 'Glass Chat', 'General AI conversation, Q&A, reasoning, writing, and tutoring.', 'MessageSquare', 10),
  ('search', 'Glass Search', 'Research, comparison, market analysis, and source-based answers.', 'Search', 20),
  ('build', 'Glass Build', 'Generate UI, landing pages, components, and app layouts.', 'LayoutTemplate', 30),
  ('code', 'Glass Code', 'Generate, debug, explain, refactor, and review code.', 'Code2', 40),
  ('omni', 'Glass Omni', 'Orchestrate big workflows from idea to final output.', 'Sparkles', 50)
ON CONFLICT (tool_key) DO NOTHING;

INSERT INTO public.workflow_modes (mode_key, name, description, internal_flow, sort_order) VALUES
  ('think', 'Think', 'Understand goals, plan, structure, and recommend next actions.', 'Understand → Plan → Structure → Recommend', 10),
  ('research', 'Research', 'Research topics, compare information, verify, and summarize.', 'Search → Compare → Verify → Summarize', 20),
  ('create', 'Create', 'Write, draft, improve, and finalize creative or professional content.', 'Understand tone → Generate draft → Improve → Finalize', 30),
  ('build', 'Build', 'Plan product structure, generate layout, improve UX, and finalize.', 'Plan structure → Generate layout → Improve UX → Finalize', 40),
  ('code', 'Code', 'Analyze problems, detect issues, generate fixes, and review solutions.', 'Analyze problem → Detect issue → Generate fix → Review solution', 50),
  ('analyze', 'Analyze', 'Inspect outputs, critique weaknesses, improve, and validate.', 'Inspect → Critique → Improve → Validate', 60),
  ('launch', 'Launch', 'Prepare launch, optimize, launch, and monitor progress.', 'Prepare → Optimize → Launch → Monitor', 70),
  ('automate', 'Automate', 'Plan workflows, execute steps, monitor progress, and produce results.', 'Plan workflow → Execute steps → Monitor progress → Generate result', 80)
ON CONFLICT (mode_key) DO NOTHING;

INSERT INTO public.skill_catalog (skill_key, name, description, category, instructions, example_prompts, sort_order) VALUES
  ('prd-writer', 'PRD Writer', 'Turns ideas into clear product requirement documents.', 'Product', 'Create clear PRDs with goals, scope, users, requirements, risks, metrics, and milestones.', '["Buat PRD UseGlass AI versi mobile"]', 10),
  ('saas-planner', 'SaaS Planner', 'Plans SaaS products from idea to launch.', 'Business', 'Plan SaaS MVP, positioning, pricing, roadmap, launch, and growth strategy.', '["Buat SaaS plan dari ide ini"]', 20),
  ('ui-reviewer', 'UI Reviewer', 'Reviews UI for clarity, hierarchy, accessibility, and polish.', 'Design', 'Audit UI hierarchy, spacing, contrast, accessibility, interaction, and polish.', '["Audit UX halaman ini"]', 30),
  ('code-debugger', 'Code Debugger', 'Finds root causes and gives safe code fixes.', 'Code', 'Find root cause, explain issue, propose minimal safe fix, and mention tests.', '["Fix error npm run build ini"]', 40),
  ('academic-writer', 'Academic Writer', 'Writes clear academic answers with structure and citations guidance.', 'Writing', 'Write structured academic explanations with thesis, arguments, evidence guidance, and clarity.', '["Buat makalah dari topik ini"]', 50),
  ('brand-copywriter', 'Brand Copywriter', 'Creates sharp brand messaging and conversion copy.', 'Marketing', 'Create conversion-focused brand messaging, headlines, value props, and CTAs.', '["Buat copywriting landing page"]', 60),
  ('prompt-engineer', 'Prompt Engineer', 'Improves prompts into reliable reusable instructions.', 'AI', 'Rewrite prompts with goal, context, task, constraints, output, and format.', '["Perbaiki prompt ini"]', 70),
  ('business-analyst', 'Business Analyst', 'Analyzes markets, competitors, users, and business risks.', 'Business', 'Analyze market, users, competitors, risks, opportunities, and recommendations.', '["Riset kompetitor AI workspace"]', 80),
  ('study-assistant', 'Study Assistant', 'Turns topics into simple explanations and study plans.', 'Learning', 'Explain simply, step-by-step, with examples, analogies, and practice plans.', '["Jelaskan materi ini dengan sederhana"]', 90),
  ('content-creator', 'Content Creator', 'Plans and writes content across channels.', 'Content', 'Create channel-aware content, hooks, scripts, captions, and posting plans.', '["Buat caption promosi"]', 100)
ON CONFLICT (skill_key) DO NOTHING;

INSERT INTO public.style_catalog (style_key, name, description, tone, formatting_preference, sort_order) VALUES
  ('normal', 'Normal', 'Balanced, natural, and clear.', 'neutral', 'Clear paragraphs and bullets when useful.', 10),
  ('calm-teacher', 'Calm Teacher', 'Patient, simple, step-by-step teaching style.', 'calm', 'Step-by-step with light analogies.', 20),
  ('professional', 'Professional', 'Formal and polished for business documents.', 'formal', 'Structured headings and clean bullets.', 30),
  ('concise', 'Concise', 'Short and direct.', 'direct', 'Minimal bullets.', 40),
  ('deep-thinker', 'Deep Thinker', 'Detailed analysis with risks and alternatives.', 'analytical', 'Sections for options, risks, and recommendation.', 50),
  ('creative-writer', 'Creative Writer', 'Creative voice for branding and storytelling.', 'creative', 'Variations and punchy copy.', 60),
  ('startup-founder', 'Startup Founder', 'Product, growth, MVP, pricing, and launch oriented.', 'founder', 'Actionable strategy and priorities.', 70),
  ('senior-engineer', 'Senior Engineer', 'Technical, maintainable, scalable engineering style.', 'technical', 'Root cause, fix, edge cases, tests.', 80),
  ('critical-reviewer', 'Critical Reviewer', 'Finds weaknesses and gives sharp improvements.', 'critical', 'Issues, impact, fixes.', 90),
  ('friendly-assistant', 'Friendly Assistant', 'Friendly and easy to understand.', 'friendly', 'Natural explanation.', 100),
  ('research-analyst', 'Research Analyst', 'Objective, structured, data-driven research style.', 'objective', 'Summary, key points, evidence, confidence.', 110),
  ('minimal', 'Minimal', 'Very short and straight to the point.', 'minimal', 'Only essentials.', 120),
  ('motivator', 'Motivator', 'Supportive, encouraging, and actionable.', 'supportive', 'Encouraging steps and next action.', 130)
ON CONFLICT (style_key) DO NOTHING;

INSERT INTO public.connector_catalog (connector_key, name, description, category, default_status, capabilities, permission_summary, example_prompts, sort_order) VALUES
  ('google-drive', 'Google Drive', 'Read and search Drive files when connected.', 'Storage', 'coming_soon', '["search","read","sync"]', 'Access selected Drive files after connection.', '["Cari dokumen proposal di Drive"]', 10),
  ('github', 'GitHub', 'Use repository context for code tasks.', 'Code', 'disconnected', '["search","read"]', 'Read selected repositories after connection.', '["Cek error build repo saya"]', 20),
  ('gmail', 'Gmail', 'Search and summarize email context.', 'Email', 'coming_soon', '["search","read"]', 'Read selected email context after connection.', '["Ringkas email client minggu ini"]', 30),
  ('google-calendar', 'Google Calendar', 'Use schedule context for planning.', 'Calendar', 'coming_soon', '["read","sync"]', 'Read selected calendar events after connection.', '["Buat jadwal kerja minggu ini"]', 40),
  ('notion', 'Notion', 'Search Notion pages and notes.', 'Notes', 'coming_soon', '["search","read","sync"]', 'Read selected Notion workspace content.', '["Cari catatan meeting di Notion"]', 50),
  ('slack', 'Slack', 'Summarize channel context.', 'Communication', 'coming_soon', '["search","read"]', 'Read selected Slack channels after connection.', '["Ringkas diskusi channel produk"]', 60),
  ('discord', 'Discord', 'Read community discussion context.', 'Community', 'coming_soon', '["search","read"]', 'Read selected Discord channels after connection.', '["Ringkas feedback komunitas"]', 70),
  ('supabase', 'Supabase Database', 'Inspect database context when connected.', 'Database', 'coming_soon', '["read","deep research"]', 'Read selected database schema and rows after connection.', '["Audit schema database ini"]', 80),
  ('web-search', 'Web Search', 'Use web context for research answers.', 'Research', 'connected', '["search","read","deep research"]', 'Use public web search context.', '["Riset kompetitor AI workspace"]', 90),
  ('local-documents', 'Local Documents', 'Use uploaded local documents as context.', 'Files', 'disconnected', '["read","sync"]', 'Read uploaded user documents.', '["Rangkum file yang saya upload"]', 100)
ON CONFLICT (connector_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_useglass_canvas_user_id ON public.canvas_documents(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_useglass_canvas_session_id ON public.canvas_documents(session_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_useglass_canvas_revisions_canvas_id ON public.canvas_revisions(canvas_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_useglass_routing_events_user_id ON public.routing_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_useglass_routing_events_session_id ON public.routing_events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_useglass_user_skills_user_id ON public.user_skills(user_id, skill_key);
CREATE INDEX IF NOT EXISTS idx_useglass_user_styles_user_id ON public.user_styles(user_id, style_key);
CREATE INDEX IF NOT EXISTS idx_useglass_user_connectors_user_id ON public.user_connectors(user_id, connector_key);
CREATE INDEX IF NOT EXISTS idx_useglass_workflow_runs_user_id ON public.workflow_runs(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_useglass_workflow_steps_run_id ON public.workflow_steps(run_id, step_index);
CREATE INDEX IF NOT EXISTS idx_useglass_prompt_history_user_id ON public.prompt_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_useglass_attachments_session_id ON public.attachments(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_useglass_exports_user_id ON public.exports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_useglass_audit_events_user_id ON public.audit_events(user_id, created_at DESC);

ALTER TABLE public.canvas_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'canvas_documents', 'canvas_revisions', 'routing_events', 'user_skills', 'user_styles',
    'user_connectors', 'user_preferences', 'workflow_runs', 'workflow_steps', 'prompt_history',
    'attachments', 'exports'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name AND policyname = table_name || '_owner_all'
    ) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id)', table_name || '_owner_all', table_name);
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_events' AND policyname = 'audit_events_owner_select'
  ) THEN
    CREATE POLICY audit_events_owner_select ON public.audit_events
      FOR SELECT USING (auth.uid()::text = user_id);
  END IF;
END $$;
