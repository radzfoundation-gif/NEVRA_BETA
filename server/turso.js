import { createClient } from '@libsql/client';
import crypto from 'crypto';

const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;
const localUrl = process.env.TURSO_LOCAL_URL || 'file:./useglass-turso.db';

export const turso = createClient({
  url: tursoUrl || localUrl,
  authToken: tursoUrl?.startsWith('libsql://') ? tursoAuthToken : undefined,
});

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const json = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

export async function initTursoSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS user_subscriptions (
      user_id TEXT PRIMARY KEY,
      tier TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'inactive',
      valid_until TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS token_usage (
      user_id TEXT NOT NULL,
      usage_day TEXT NOT NULL,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, usage_day)
    )`,
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'Untitled Project',
      description TEXT,
      notes TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS project_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'Untitled Item',
      content TEXT,
      reference_id TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'Untitled Document',
      file_name TEXT,
      mime_type TEXT,
      content TEXT,
      summary TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS saved_outputs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      source_session_id TEXT,
      output_type TEXT NOT NULL DEFAULT 'text',
      title TEXT NOT NULL DEFAULT 'Saved Output',
      content TEXT NOT NULL DEFAULT '',
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_turso_projects_user ON projects(user_id, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_items_project ON project_items(project_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_documents_user ON documents(user_id, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_outputs_user ON saved_outputs(user_id, created_at DESC)`,
    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'New Chat',
      summary TEXT DEFAULT '',
      glass_mode TEXT,
      workflow_mode TEXT,
      glass_style TEXT,
      active_skill_id TEXT,
      active_connector_id TEXT,
      canvas_type TEXT,
      auto_pilot INTEGER NOT NULL DEFAULT 1,
      pinned INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0,
      is_shared INTEGER NOT NULL DEFAULT 0,
      share_id TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      model TEXT,
      reasoning INTEGER NOT NULL DEFAULT 0,
      tokens INTEGER NOT NULL DEFAULT 0,
      attachments TEXT DEFAULT '[]',
      routing TEXT DEFAULT '{}',
      metadata TEXT DEFAULT '{}',
      parent_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS canvas_documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      project_id TEXT,
      canvas_type TEXT NOT NULL DEFAULT 'document',
      title TEXT NOT NULL DEFAULT 'Untitled Canvas',
      content TEXT NOT NULL DEFAULT '',
      content_format TEXT DEFAULT 'markdown',
      source_prompt TEXT,
      source_tool TEXT,
      source_workflow TEXT,
      source_style TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS canvas_revisions (
      id TEXT PRIMARY KEY,
      canvas_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      change_summary TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS routing_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      message_id TEXT,
      prompt TEXT NOT NULL DEFAULT '',
      detected_intent TEXT,
      selected_tool TEXT,
      selected_workflow TEXT,
      selected_style TEXT,
      selected_skill TEXT,
      selected_connector TEXT,
      canvas_type TEXT,
      output_format TEXT,
      confidence REAL,
      reason TEXT,
      auto_pilot INTEGER NOT NULL DEFAULT 1,
      override INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_key TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      is_custom INTEGER NOT NULL DEFAULT 0,
      name TEXT,
      description TEXT,
      category TEXT,
      instructions TEXT,
      example_prompts TEXT DEFAULT '[]',
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_styles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      style_key TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      is_custom INTEGER NOT NULL DEFAULT 0,
      name TEXT,
      description TEXT,
      tone TEXT,
      formatting_preference TEXT,
      do_rules TEXT DEFAULT '[]',
      avoid_rules TEXT DEFAULT '[]',
      example_text TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_connectors (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      connector_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'disconnected',
      capabilities TEXT DEFAULT '[]',
      credentials TEXT,
      metadata TEXT DEFAULT '{}',
      last_synced_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      auto_pilot INTEGER NOT NULL DEFAULT 1,
      default_tool TEXT DEFAULT 'chat',
      default_workflow TEXT DEFAULT 'think',
      default_style TEXT DEFAULT 'normal',
      default_model TEXT DEFAULT 'sonnet',
      ui_theme TEXT DEFAULT 'light',
      sidebar_state TEXT DEFAULT 'expanded',
      metadata TEXT DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS glass_tools (
      tool_key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS workflow_modes (
      mode_key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      internal_flow TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS skill_catalog (
      skill_key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      instructions TEXT,
      example_prompts TEXT DEFAULT '[]',
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS style_catalog (
      style_key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      tone TEXT,
      formatting_preference TEXT,
      do_rules TEXT DEFAULT '[]',
      avoid_rules TEXT DEFAULT '[]',
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS connector_catalog (
      connector_key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      default_status TEXT NOT NULL DEFAULT 'disconnected',
      capabilities TEXT DEFAULT '[]',
      permission_summary TEXT,
      example_prompts TEXT DEFAULT '[]',
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      project_id TEXT,
      goal TEXT NOT NULL DEFAULT '',
      tool TEXT,
      workflow_mode TEXT,
      style TEXT,
      status TEXT NOT NULL DEFAULT 'planning',
      plan TEXT DEFAULT '[]',
      result TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS workflow_steps (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      step_index INTEGER NOT NULL DEFAULT 0,
      name TEXT NOT NULL DEFAULT 'Step',
      tool TEXT,
      workflow_mode TEXT,
      style TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      input TEXT DEFAULT '',
      output TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS prompt_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      original_prompt TEXT NOT NULL DEFAULT '',
      improved_prompt TEXT,
      tool TEXT,
      workflow_mode TEXT,
      style TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      message_id TEXT,
      attachment_type TEXT NOT NULL DEFAULT 'file',
      name TEXT NOT NULL DEFAULT 'Attachment',
      mime_type TEXT,
      size INTEGER NOT NULL DEFAULT 0,
      url TEXT,
      content TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS exports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT,
      export_format TEXT NOT NULL DEFAULT 'pdf',
      title TEXT NOT NULL DEFAULT 'Export',
      file_url TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event_type TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      payload TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_turso_chat_sessions_user ON chat_sessions(user_id, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_chat_messages_session ON chat_messages(session_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_canvas_user ON canvas_documents(user_id, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_canvas_session ON canvas_documents(session_id, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_canvas_revisions_canvas ON canvas_revisions(canvas_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_routing_events_user ON routing_events(user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_routing_events_session ON routing_events(session_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_user_skills_user ON user_skills(user_id, skill_key)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_user_styles_user ON user_styles(user_id, style_key)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_user_connectors_user ON user_connectors(user_id, connector_key)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_workflow_runs_user ON workflow_runs(user_id, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_workflow_steps_run ON workflow_steps(run_id, step_index)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_prompt_history_user ON prompt_history(user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_attachments_session ON attachments(session_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_exports_user ON exports(user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_turso_audit_user ON audit_events(user_id, created_at DESC)`,
    `INSERT OR IGNORE INTO glass_tools (tool_key, name, description, icon, sort_order) VALUES
      ('chat', 'Glass Chat', 'General AI conversation, Q&A, reasoning, writing, and tutoring.', 'MessageSquare', 10),
      ('search', 'Glass Search', 'Research, comparison, market analysis, and source-based answers.', 'Search', 20),
      ('build', 'Glass Build', 'Generate UI, landing pages, components, and app layouts.', 'LayoutTemplate', 30),
      ('code', 'Glass Code', 'Generate, debug, explain, refactor, and review code.', 'Code2', 40),
      ('omni', 'Glass Omni', 'Orchestrate big workflows from idea to final output.', 'Sparkles', 50)`,
    `INSERT OR IGNORE INTO workflow_modes (mode_key, name, description, internal_flow, sort_order) VALUES
      ('think', 'Think', 'Understand goals, plan, structure, and recommend next actions.', 'Understand → Plan → Structure → Recommend', 10),
      ('research', 'Research', 'Research topics, compare information, verify, and summarize.', 'Search → Compare → Verify → Summarize', 20),
      ('create', 'Create', 'Write, draft, improve, and finalize creative or professional content.', 'Understand tone → Generate draft → Improve → Finalize', 30),
      ('build', 'Build', 'Plan product structure, generate layout, improve UX, and finalize.', 'Plan structure → Generate layout → Improve UX → Finalize', 40),
      ('code', 'Code', 'Analyze problems, detect issues, generate fixes, and review solutions.', 'Analyze problem → Detect issue → Generate fix → Review solution', 50),
      ('analyze', 'Analyze', 'Inspect outputs, critique weaknesses, improve, and validate.', 'Inspect → Critique → Improve → Validate', 60),
      ('launch', 'Launch', 'Prepare launch, optimize, launch, and monitor progress.', 'Prepare → Optimize → Launch → Monitor', 70),
      ('automate', 'Automate', 'Plan workflows, execute steps, monitor progress, and produce results.', 'Plan workflow → Execute steps → Monitor progress → Generate result', 80)`,
    `INSERT OR IGNORE INTO skill_catalog (skill_key, name, description, category, instructions, example_prompts, sort_order) VALUES
      ('prd-writer', 'PRD Writer', 'Turns ideas into clear product requirement documents.', 'Product', 'Create clear PRDs with goals, scope, users, requirements, risks, metrics, and milestones.', '["Buat PRD UseGlass AI versi mobile"]', 10),
      ('saas-planner', 'SaaS Planner', 'Plans SaaS products from idea to launch.', 'Business', 'Plan SaaS MVP, positioning, pricing, roadmap, launch, and growth strategy.', '["Buat SaaS plan dari ide ini"]', 20),
      ('ui-reviewer', 'UI Reviewer', 'Reviews UI for clarity, hierarchy, accessibility, and polish.', 'Design', 'Audit UI hierarchy, spacing, contrast, accessibility, interaction, and polish.', '["Audit UX halaman ini"]', 30),
      ('code-debugger', 'Code Debugger', 'Finds root causes and gives safe code fixes.', 'Code', 'Find root cause, explain issue, propose minimal safe fix, and mention tests.', '["Fix error npm run build ini"]', 40),
      ('academic-writer', 'Academic Writer', 'Writes clear academic answers with structure and citations guidance.', 'Writing', 'Write structured academic explanations with thesis, arguments, evidence guidance, and clarity.', '["Buat makalah dari topik ini"]', 50),
      ('brand-copywriter', 'Brand Copywriter', 'Creates sharp brand messaging and conversion copy.', 'Marketing', 'Create conversion-focused brand messaging, headlines, value props, and CTAs.', '["Buat copywriting landing page"]', 60),
      ('prompt-engineer', 'Prompt Engineer', 'Improves prompts into reliable reusable instructions.', 'AI', 'Rewrite prompts with goal, context, task, constraints, output, and format.', '["Perbaiki prompt ini"]', 70),
      ('business-analyst', 'Business Analyst', 'Analyzes markets, competitors, users, and business risks.', 'Business', 'Analyze market, users, competitors, risks, opportunities, and recommendations.', '["Riset kompetitor AI workspace"]', 80),
      ('study-assistant', 'Study Assistant', 'Turns topics into simple explanations and study plans.', 'Learning', 'Explain simply, step-by-step, with examples, analogies, and practice plans.', '["Jelaskan materi ini dengan sederhana"]', 90),
      ('content-creator', 'Content Creator', 'Plans and writes content across channels.', 'Content', 'Create channel-aware content, hooks, scripts, captions, and posting plans.', '["Buat caption promosi"]', 100)`,
    `INSERT OR IGNORE INTO style_catalog (style_key, name, description, tone, formatting_preference, sort_order) VALUES
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
      ('motivator', 'Motivator', 'Supportive, encouraging, and actionable.', 'supportive', 'Encouraging steps and next action.', 130)`,
    `INSERT OR IGNORE INTO connector_catalog (connector_key, name, description, category, default_status, capabilities, permission_summary, example_prompts, sort_order) VALUES
      ('google-drive', 'Google Drive', 'Read and search Drive files when connected.', 'Storage', 'coming_soon', '["search","read","sync"]', 'Access selected Drive files after connection.', '["Cari dokumen proposal di Drive"]', 10),
      ('github', 'GitHub', 'Use repository context for code tasks.', 'Code', 'disconnected', '["search","read"]', 'Read selected repositories after connection.', '["Cek error build repo saya"]', 20),
      ('gmail', 'Gmail', 'Search and summarize email context.', 'Email', 'coming_soon', '["search","read"]', 'Read selected email context after connection.', '["Ringkas email client minggu ini"]', 30),
      ('google-calendar', 'Google Calendar', 'Use schedule context for planning.', 'Calendar', 'coming_soon', '["read","sync"]', 'Read selected calendar events after connection.', '["Buat jadwal kerja minggu ini"]', 40),
      ('notion', 'Notion', 'Search Notion pages and notes.', 'Notes', 'coming_soon', '["search","read","sync"]', 'Read selected Notion workspace content.', '["Cari catatan meeting di Notion"]', 50),
      ('slack', 'Slack', 'Summarize channel context.', 'Communication', 'coming_soon', '["search","read"]', 'Read selected Slack channels after connection.', '["Ringkas diskusi channel produk"]', 60),
      ('discord', 'Discord', 'Read community discussion context.', 'Community', 'coming_soon', '["search","read"]', 'Read selected Discord channels after connection.', '["Ringkas feedback komunitas"]', 70),
      ('supabase', 'Supabase Database', 'Inspect database context when connected.', 'Database', 'coming_soon', '["read","deep research"]', 'Read selected database schema and rows after connection.', '["Audit schema database ini"]', 80),
      ('web-search', 'Web Search', 'Use web context for research answers.', 'Research', 'connected', '["search","read","deep research"]', 'Use public web search context.', '["Riset kompetitor AI workspace"]', 90),
      ('local-documents', 'Local Documents', 'Use uploaded local documents as context.', 'Files', 'disconnected', '["read","sync"]', 'Read uploaded user documents.', '["Rangkum file yang saya upload"]', 100)`,
  ];
  for (const sql of statements) await turso.execute(sql);
}

export function mapRow(row) {
  const mapped = { ...row };
  if ('metadata' in mapped) mapped.metadata = json(mapped.metadata);
  return mapped;
}

export const todayKey = () => new Date().toISOString().slice(0, 10);

export async function getCreditUsage(userId) {
  const day = todayKey();
  const sub = await turso.execute({ sql: 'SELECT tier, status, valid_until FROM user_subscriptions WHERE user_id = ?', args: [userId] });
  const subscription = sub.rows[0];
  const isPro = subscription?.status === 'active' && subscription?.valid_until && new Date(String(subscription.valid_until)) > new Date();
  const limitsDisabled = process.env.DISABLE_CREDIT_LIMITS === 'true';
  const tier = limitsDisabled ? 'pro' : (isPro ? 'pro' : 'free');
  const limit = tier === 'pro' ? -1 : 20;
  const usage = await turso.execute({ sql: 'SELECT tokens_used FROM token_usage WHERE user_id = ? AND usage_day = ?', args: [userId, day] });
  const used = Number(usage.rows[0]?.tokens_used || 0);
  return {
    used,
    limit,
    tier,
    credits: tier === 'pro' ? 999999 : Math.max(0, limit - used),
    unlimited: tier === 'pro',
    limitsDisabled,
  };
}

export async function incrementCreditUsage(userId, amount = 1) {
  const day = todayKey();
  await turso.execute({
    sql: `INSERT INTO token_usage (user_id, usage_day, tokens_used, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, usage_day) DO UPDATE SET
          tokens_used = tokens_used + excluded.tokens_used,
          updated_at = excluded.updated_at`,
    args: [userId, day, amount, now()],
  });
  return getCreditUsage(userId);
}

export async function listWorkspace(userId) {
  const [projects, outputs] = await Promise.all([
    turso.execute({ sql: 'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC', args: [userId] }),
    turso.execute({ sql: 'SELECT * FROM saved_outputs WHERE user_id = ? ORDER BY created_at DESC LIMIT 25', args: [userId] }),
  ]);
  return {
    projects: projects.rows.map(mapRow),
    savedOutputs: outputs.rows.map(mapRow),
  };
}

export async function createProject(userId, name, description = '') {
  const project = { id: id(), user_id: userId, name: name || 'Untitled Project', description, notes: '', metadata: {}, created_at: now(), updated_at: now() };
  await turso.execute({
    sql: 'INSERT INTO projects (id, user_id, name, description, notes, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [project.id, userId, project.name, project.description, project.notes, JSON.stringify(project.metadata), project.created_at, project.updated_at],
  });
  return project;
}

export async function getProjectDetail(userId, projectId) {
  const [project, items] = await Promise.all([
    turso.execute({ sql: 'SELECT * FROM projects WHERE id = ? AND user_id = ?', args: [projectId, userId] }),
    turso.execute({ sql: 'SELECT * FROM project_items WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC', args: [projectId, userId] }),
  ]);
  return { project: project.rows[0] ? mapRow(project.rows[0]) : null, items: items.rows.map(mapRow) };
}

export async function addProjectNote(userId, projectId, content) {
  const createdAt = now();
  const note = { id: id(), project_id: projectId, user_id: userId, item_type: 'note', title: content.trim().slice(0, 80) || 'Note', content, reference_id: null, metadata: {}, created_at: createdAt };
  await turso.batch([
    { sql: 'INSERT INTO project_items (id, project_id, user_id, item_type, title, content, reference_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', args: [note.id, projectId, userId, note.item_type, note.title, note.content, null, '{}', createdAt] },
    { sql: 'UPDATE projects SET updated_at = ? WHERE id = ? AND user_id = ?', args: [createdAt, projectId, userId] },
  ]);
  return note;
}

export async function saveOutput(userId, input) {
  const createdAt = now();
  const output = {
    id: id(),
    user_id: userId,
    project_id: input.projectId || null,
    source_session_id: input.sourceSessionId || null,
    output_type: input.outputType || 'text',
    title: input.title || 'Saved Output',
    content: input.content || '',
    metadata: input.metadata || {},
    created_at: createdAt,
  };
  const statements = [{
    sql: 'INSERT INTO saved_outputs (id, user_id, project_id, source_session_id, output_type, title, content, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [output.id, userId, output.project_id, output.source_session_id, output.output_type, output.title, output.content, JSON.stringify(output.metadata), createdAt],
  }];
  if (output.project_id) {
    statements.push({
      sql: 'INSERT INTO project_items (id, project_id, user_id, item_type, title, content, reference_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id(), output.project_id, userId, output.output_type === 'builder' ? 'builder_output' : output.output_type === 'code' ? 'code' : 'saved_output', output.title, output.content, output.id, JSON.stringify(output.metadata), createdAt],
    });
    statements.push({ sql: 'UPDATE projects SET updated_at = ? WHERE id = ? AND user_id = ?', args: [createdAt, output.project_id, userId] });
  }
  await turso.batch(statements);
  return output;
}

export async function listDocuments(userId) {
  const result = await turso.execute({ sql: 'SELECT * FROM documents WHERE user_id = ? ORDER BY updated_at DESC', args: [userId] });
  return result.rows.map(mapRow);
}

export async function createDocument(userId, input) {
  const createdAt = now();
  const doc = { id: id(), user_id: userId, title: input.title || 'Untitled Document', file_name: input.fileName || input.file_name || null, mime_type: input.mimeType || input.mime_type || null, content: input.content || '', summary: input.summary || '', metadata: input.metadata || {}, created_at: createdAt, updated_at: createdAt };
  await turso.execute({ sql: 'INSERT INTO documents (id, user_id, title, file_name, mime_type, content, summary, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', args: [doc.id, userId, doc.title, doc.file_name, doc.mime_type, doc.content, doc.summary, JSON.stringify(doc.metadata), createdAt, createdAt] });
  return doc;
}
