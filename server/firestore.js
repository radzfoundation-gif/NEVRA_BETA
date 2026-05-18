import crypto from 'crypto';
import { db } from './firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

const newId = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();
const todayKey = () => new Date().toISOString().slice(0, 10);

const stripUndefined = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
};

const tsToIso = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (typeof value._seconds === 'number') {
    return new Date(value._seconds * 1000 + Math.floor((value._nanoseconds || 0) / 1e6)).toISOString();
  }
  return null;
};

const docToObject = (snapshot) => {
  if (!snapshot.exists) return null;
  const data = snapshot.data() || {};
  const out = { ...data };
  if (out.createdAt !== undefined) out.createdAt = tsToIso(out.createdAt);
  if (out.updatedAt !== undefined) out.updatedAt = tsToIso(out.updatedAt);
  if (!out.id) out.id = snapshot.id;
  return out;
};

const userRef = (uid) => db.collection('users').doc(uid);
const subscriptionRef = (uid) => userRef(uid).collection('private').doc('subscription');
const preferencesRef = (uid) => userRef(uid).collection('private').doc('preferences');
const creditDocRef = (uid, day = todayKey()) => userRef(uid).collection('credits').doc(day);
const sessionsRef = (uid) => userRef(uid).collection('sessions');
const messagesRef = (uid, sid) => sessionsRef(uid).doc(sid).collection('messages');
const projectsRef = (uid) => userRef(uid).collection('projects');
const projectItemsRef = (uid, pid) => projectsRef(uid).doc(pid).collection('items');
const savedOutputsRef = (uid) => userRef(uid).collection('savedOutputs');
const documentsRef = (uid) => userRef(uid).collection('documents');
const skillsRef = (uid) => userRef(uid).collection('skills');

const catalogRef = (id) => db.collection('catalog').doc(id).collection('items');

// ── Subscription / credits ──────────────────────────────────────────────
export async function getCreditUsage(userId) {
  const subSnap = await subscriptionRef(userId).get();
  const sub = subSnap.exists ? subSnap.data() : null;
  const isPro = sub?.status === 'active' && sub?.validUntil && new Date(sub.validUntil) > new Date();
  const limitsDisabled = process.env.DISABLE_CREDIT_LIMITS === 'true';
  const tier = limitsDisabled ? 'pro' : (isPro ? 'pro' : 'free');
  const limit = tier === 'pro' ? -1 : 20;

  const usageSnap = await creditDocRef(userId).get();
  const used = Number(usageSnap.exists ? usageSnap.data().tokensUsed || 0 : 0);

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
  await creditDocRef(userId).set(
    {
      userId,
      day: todayKey(),
      tokensUsed: FieldValue.increment(Number(amount) || 1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return getCreditUsage(userId);
}

// ── Workspace (projects + saved outputs) ─────────────────────────────────
export async function listWorkspace(userId) {
  const [projectsSnap, outputsSnap] = await Promise.all([
    projectsRef(userId).orderBy('updatedAt', 'desc').get(),
    savedOutputsRef(userId).orderBy('createdAt', 'desc').limit(25).get(),
  ]);
  return {
    projects: projectsSnap.docs.map(docToObject),
    savedOutputs: outputsSnap.docs.map(docToObject),
  };
}

export async function createProject(userId, name, description = '') {
  const id = newId();
  const data = stripUndefined({
    id,
    userId,
    name: name || 'Untitled Project',
    description,
    notes: '',
    metadata: {},
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await projectsRef(userId).doc(id).set(data);
  return { ...data, createdAt: nowIso(), updatedAt: nowIso() };
}

export async function getProjectDetail(userId, projectId) {
  const [projectSnap, itemsSnap] = await Promise.all([
    projectsRef(userId).doc(projectId).get(),
    projectItemsRef(userId, projectId).orderBy('createdAt', 'desc').get(),
  ]);
  return {
    project: docToObject(projectSnap),
    items: itemsSnap.docs.map(docToObject),
  };
}

export async function addProjectNote(userId, projectId, content) {
  const id = newId();
  const note = stripUndefined({
    id,
    projectId,
    userId,
    itemType: 'note',
    title: content.trim().slice(0, 80) || 'Note',
    content,
    referenceId: null,
    metadata: {},
    createdAt: FieldValue.serverTimestamp(),
  });
  const batch = db.batch();
  batch.set(projectItemsRef(userId, projectId).doc(id), note);
  batch.update(projectsRef(userId).doc(projectId), { updatedAt: FieldValue.serverTimestamp() });
  await batch.commit();
  return { ...note, createdAt: nowIso() };
}

export async function saveOutput(userId, input = {}) {
  const id = newId();
  const output = stripUndefined({
    id,
    userId,
    projectId: input.projectId || null,
    sourceSessionId: input.sourceSessionId || null,
    outputType: input.outputType || 'text',
    title: input.title || 'Saved Output',
    content: input.content || '',
    metadata: input.metadata || {},
    createdAt: FieldValue.serverTimestamp(),
  });
  const batch = db.batch();
  batch.set(savedOutputsRef(userId).doc(id), output);
  if (output.projectId) {
    const itemId = newId();
    const itemType = output.outputType === 'builder' ? 'builder_output' : output.outputType === 'code' ? 'code' : 'saved_output';
    batch.set(projectItemsRef(userId, output.projectId).doc(itemId), stripUndefined({
      id: itemId,
      projectId: output.projectId,
      userId,
      itemType,
      title: output.title,
      content: output.content,
      referenceId: id,
      metadata: output.metadata,
      createdAt: FieldValue.serverTimestamp(),
    }));
    batch.update(projectsRef(userId).doc(output.projectId), { updatedAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();
  return { ...output, createdAt: nowIso() };
}

// ── Chat sessions / messages ─────────────────────────────────────────────
const sessionShape = (id, userId, input = {}) => stripUndefined({
  id,
  userId,
  title: input.title || 'New Chat',
  summary: input.summary || '',
  glassMode: input.glassMode ?? input.glass_mode ?? input.mode ?? null,
  workflowMode: input.workflowMode ?? input.workflow_mode ?? null,
  glassStyle: input.glassStyle ?? input.glass_style ?? null,
  activeSkillId: input.activeSkillId ?? input.active_skill_id ?? null,
  activeConnectorId: input.activeConnectorId ?? input.active_connector_id ?? null,
  canvasType: input.canvasType ?? input.canvas_type ?? null,
  autoPilot: input.autoPilot ?? input.auto_pilot ?? true,
  pinned: input.pinned ?? false,
  archived: input.archived ?? false,
  isShared: false,
  shareId: null,
  metadata: input.metadata || { provider: input.provider || null },
});

export async function createChatSession(userId, input = {}) {
  const id = newId();
  const data = {
    ...sessionShape(id, userId, input),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await sessionsRef(userId).doc(id).set(data);
  return { ...data, createdAt: nowIso(), updatedAt: nowIso() };
}

export async function listChatSessions(userId) {
  const snap = await sessionsRef(userId)
    .where('archived', '==', false)
    .orderBy('updatedAt', 'desc')
    .get();
  return snap.docs.map(docToObject);
}

export async function getChatSession(userId, sessionId) {
  const snap = await sessionsRef(userId).doc(sessionId).get();
  return docToObject(snap);
}

export async function updateChatSession(userId, sessionId, updates = {}) {
  const ref = sessionsRef(userId).doc(sessionId);
  const existing = await ref.get();
  if (!existing.exists) return null;
  const current = existing.data();
  const merged = stripUndefined({
    title: updates.title ?? current.title,
    summary: updates.summary ?? current.summary ?? '',
    glassMode: updates.glassMode ?? updates.glass_mode ?? current.glassMode ?? null,
    workflowMode: updates.workflowMode ?? updates.workflow_mode ?? current.workflowMode ?? null,
    glassStyle: updates.glassStyle ?? updates.glass_style ?? current.glassStyle ?? null,
    activeSkillId: updates.activeSkillId ?? updates.active_skill_id ?? current.activeSkillId ?? null,
    activeConnectorId: updates.activeConnectorId ?? updates.active_connector_id ?? current.activeConnectorId ?? null,
    canvasType: updates.canvasType ?? updates.canvas_type ?? current.canvasType ?? null,
    autoPilot: updates.autoPilot ?? updates.auto_pilot ?? current.autoPilot,
    pinned: updates.pinned ?? current.pinned,
    archived: updates.archived ?? current.archived,
    metadata: updates.metadata ?? current.metadata ?? {},
    updatedAt: FieldValue.serverTimestamp(),
  });
  await ref.update(merged);
  return getChatSession(userId, sessionId);
}

export async function deleteChatSession(userId, sessionId) {
  const messagesSnap = await messagesRef(userId, sessionId).get();
  const batch = db.batch();
  messagesSnap.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(sessionsRef(userId).doc(sessionId));
  await batch.commit();
  return { ok: true };
}

export async function saveChatMessage(userId, sessionId, input = {}) {
  const sessionRef = sessionsRef(userId).doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) return null;
  const id = newId();
  const role = input.role === 'ai' ? 'assistant' : (input.role || 'user');
  const message = stripUndefined({
    id,
    sessionId,
    userId,
    role,
    content: input.content || '',
    model: input.model || null,
    reasoning: Boolean(input.reasoning),
    tokens: Number(input.tokens || 0),
    attachments: input.attachments || input.images || [],
    routing: input.routing || {},
    metadata: input.metadata || { code: input.code || null },
    parentId: input.parentId || input.parent_id || null,
    createdAt: FieldValue.serverTimestamp(),
  });
  const batch = db.batch();
  batch.set(messagesRef(userId, sessionId).doc(id), message);
  batch.update(sessionRef, { updatedAt: FieldValue.serverTimestamp() });
  await batch.commit();
  return { ...message, role: role === 'assistant' ? 'ai' : role, createdAt: nowIso() };
}

export async function getChatMessages(userId, sessionId) {
  const sessionSnap = await sessionsRef(userId).doc(sessionId).get();
  if (!sessionSnap.exists) return [];
  const snap = await messagesRef(userId, sessionId).orderBy('createdAt', 'asc').get();
  return snap.docs.map((doc) => {
    const data = docToObject(doc);
    if (data && data.role === 'assistant') data.role = 'ai';
    return data;
  });
}

export async function shareChatSession(userId, sessionId) {
  const shareId = newId();
  await sessionsRef(userId).doc(sessionId).update({
    isShared: true,
    shareId,
    updatedAt: FieldValue.serverTimestamp(),
  });
  // Mirror to public shares/{shareId} so anonymous readers can fetch via rules.
  const sessionSnap = await sessionsRef(userId).doc(sessionId).get();
  if (sessionSnap.exists) {
    await db.collection('shares').doc(shareId).set(
      stripUndefined({
        ...sessionSnap.data(),
        shareId,
        ownerUserId: userId,
        sourceSessionId: sessionId,
        sharedAt: FieldValue.serverTimestamp(),
      }),
      { merge: true },
    );
  }
  return shareId;
}

// ── Documents ────────────────────────────────────────────────────────────
export async function listDocuments(userId) {
  const snap = await documentsRef(userId).orderBy('updatedAt', 'desc').get();
  return snap.docs.map(docToObject);
}

export async function createDocument(userId, input = {}) {
  const id = newId();
  const data = stripUndefined({
    id,
    userId,
    title: input.title || 'Untitled Document',
    fileName: input.fileName || input.file_name || null,
    mimeType: input.mimeType || input.mime_type || null,
    content: input.content || '',
    summary: input.summary || '',
    metadata: input.metadata || {},
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await documentsRef(userId).doc(id).set(data);
  return { ...data, createdAt: nowIso(), updatedAt: nowIso() };
}

// ── User skills ──────────────────────────────────────────────────────────
const skillToObject = (snapshot) => {
  const data = docToObject(snapshot);
  if (!data) return null;
  return {
    ...data,
    enabled: Boolean(data.enabled ?? true),
    isCustom: Boolean(data.isCustom ?? data.is_custom ?? true),
    examplePrompts: Array.isArray(data.examplePrompts) ? data.examplePrompts : [],
    metadata: data.metadata || {},
    systemPrompt: data.instructions || data.systemPrompt || '',
    // back-compat for callers that read snake_case fields
    skill_key: data.skillKey || data.skill_key,
    is_custom: Boolean(data.isCustom ?? data.is_custom ?? true),
    example_prompts: Array.isArray(data.examplePrompts) ? data.examplePrompts : [],
    system_prompt: data.instructions || data.systemPrompt || '',
  };
};

export async function listUserSkills(userId) {
  const snap = await skillsRef(userId).orderBy('createdAt', 'asc').get();
  return snap.docs.map(skillToObject);
}

export async function createUserSkill(userId, input = {}) {
  const id = newId();
  const skillKey = input.skillKey || input.skill_key
    || (input.name || 'skill').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 80)
    || `skill-${Date.now()}`;
  const data = stripUndefined({
    id,
    userId,
    skillKey,
    enabled: input.enabled === false ? false : true,
    isCustom: input.isCustom === false ? false : true,
    name: input.name || 'Untitled Skill',
    description: input.description || '',
    category: input.category || null,
    instructions: input.systemPrompt || input.instructions || '',
    examplePrompts: input.examplePrompts || [],
    metadata: input.metadata || {},
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await skillsRef(userId).doc(id).set(data);
  return {
    ...data,
    skill_key: data.skillKey,
    is_custom: data.isCustom,
    example_prompts: data.examplePrompts,
    system_prompt: data.instructions,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export async function updateUserSkill(userId, skillId, updates = {}) {
  const ref = skillsRef(userId).doc(skillId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const current = snap.data();
  const merged = stripUndefined({
    name: updates.name ?? current.name,
    description: updates.description ?? current.description,
    instructions: updates.systemPrompt ?? updates.system_prompt ?? updates.instructions ?? current.instructions,
    enabled: updates.enabled === undefined ? current.enabled : Boolean(updates.enabled),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await ref.update(merged);
  const updated = await ref.get();
  return skillToObject(updated);
}

export async function deleteUserSkill(userId, skillId) {
  await skillsRef(userId).doc(skillId).delete();
  return { ok: true };
}

// ── Catalog seed (idempotent) ────────────────────────────────────────────
const GLASS_TOOLS = [
  { toolKey: 'chat', name: 'Glass Chat', description: 'General AI conversation, Q&A, reasoning, writing, and tutoring.', icon: 'MessageSquare', sortOrder: 10 },
  { toolKey: 'search', name: 'Glass Search', description: 'Research, comparison, market analysis, and source-based answers.', icon: 'Search', sortOrder: 20 },
  { toolKey: 'build', name: 'Glass Build', description: 'Generate UI, landing pages, components, and app layouts.', icon: 'LayoutTemplate', sortOrder: 30 },
  { toolKey: 'code', name: 'Glass Code', description: 'Generate, debug, explain, refactor, and review code.', icon: 'Code2', sortOrder: 40 },
  { toolKey: 'omni', name: 'Glass Omni', description: 'Orchestrate big workflows from idea to final output.', icon: 'Sparkles', sortOrder: 50 },
];

const WORKFLOW_MODES = [
  { modeKey: 'think', name: 'Think', description: 'Understand goals, plan, structure, and recommend next actions.', internalFlow: 'Understand → Plan → Structure → Recommend', sortOrder: 10 },
  { modeKey: 'research', name: 'Research', description: 'Research topics, compare information, verify, and summarize.', internalFlow: 'Search → Compare → Verify → Summarize', sortOrder: 20 },
  { modeKey: 'create', name: 'Create', description: 'Write, draft, improve, and finalize creative or professional content.', internalFlow: 'Understand tone → Generate draft → Improve → Finalize', sortOrder: 30 },
  { modeKey: 'build', name: 'Build', description: 'Plan product structure, generate layout, improve UX, and finalize.', internalFlow: 'Plan structure → Generate layout → Improve UX → Finalize', sortOrder: 40 },
  { modeKey: 'code', name: 'Code', description: 'Analyze problems, detect issues, generate fixes, and review solutions.', internalFlow: 'Analyze problem → Detect issue → Generate fix → Review solution', sortOrder: 50 },
  { modeKey: 'analyze', name: 'Analyze', description: 'Inspect outputs, critique weaknesses, improve, and validate.', internalFlow: 'Inspect → Critique → Improve → Validate', sortOrder: 60 },
  { modeKey: 'launch', name: 'Launch', description: 'Prepare launch, optimize, launch, and monitor progress.', internalFlow: 'Prepare → Optimize → Launch → Monitor', sortOrder: 70 },
  { modeKey: 'automate', name: 'Automate', description: 'Plan workflows, execute steps, monitor progress, and produce results.', internalFlow: 'Plan workflow → Execute steps → Monitor progress → Generate result', sortOrder: 80 },
];

const SKILL_CATALOG = [
  { skillKey: 'prd-writer', name: 'PRD Writer', description: 'Turns ideas into clear product requirement documents.', category: 'Product', instructions: 'Create clear PRDs with goals, scope, users, requirements, risks, metrics, and milestones.', examplePrompts: ['Buat PRD UseGlass AI versi mobile'], sortOrder: 10 },
  { skillKey: 'saas-planner', name: 'SaaS Planner', description: 'Plans SaaS products from idea to launch.', category: 'Business', instructions: 'Plan SaaS MVP, positioning, pricing, roadmap, launch, and growth strategy.', examplePrompts: ['Buat SaaS plan dari ide ini'], sortOrder: 20 },
  { skillKey: 'ui-reviewer', name: 'UI Reviewer', description: 'Reviews UI for clarity, hierarchy, accessibility, and polish.', category: 'Design', instructions: 'Audit UI hierarchy, spacing, contrast, accessibility, interaction, and polish.', examplePrompts: ['Audit UX halaman ini'], sortOrder: 30 },
  { skillKey: 'code-debugger', name: 'Code Debugger', description: 'Finds root causes and gives safe code fixes.', category: 'Code', instructions: 'Find root cause, explain issue, propose minimal safe fix, and mention tests.', examplePrompts: ['Fix error npm run build ini'], sortOrder: 40 },
  { skillKey: 'academic-writer', name: 'Academic Writer', description: 'Writes clear academic answers with structure and citations guidance.', category: 'Writing', instructions: 'Write structured academic explanations with thesis, arguments, evidence guidance, and clarity.', examplePrompts: ['Buat makalah dari topik ini'], sortOrder: 50 },
  { skillKey: 'brand-copywriter', name: 'Brand Copywriter', description: 'Creates sharp brand messaging and conversion copy.', category: 'Marketing', instructions: 'Create conversion-focused brand messaging, headlines, value props, and CTAs.', examplePrompts: ['Buat copywriting landing page'], sortOrder: 60 },
  { skillKey: 'prompt-engineer', name: 'Prompt Engineer', description: 'Improves prompts into reliable reusable instructions.', category: 'AI', instructions: 'Rewrite prompts with goal, context, task, constraints, output, and format.', examplePrompts: ['Perbaiki prompt ini'], sortOrder: 70 },
  { skillKey: 'business-analyst', name: 'Business Analyst', description: 'Analyzes markets, competitors, users, and business risks.', category: 'Business', instructions: 'Analyze market, users, competitors, risks, opportunities, and recommendations.', examplePrompts: ['Riset kompetitor AI workspace'], sortOrder: 80 },
  { skillKey: 'study-assistant', name: 'Study Assistant', description: 'Turns topics into simple explanations and study plans.', category: 'Learning', instructions: 'Explain simply, step-by-step, with examples, analogies, and practice plans.', examplePrompts: ['Jelaskan materi ini dengan sederhana'], sortOrder: 90 },
  { skillKey: 'content-creator', name: 'Content Creator', description: 'Plans and writes content across channels.', category: 'Content', instructions: 'Create channel-aware content, hooks, scripts, captions, and posting plans.', examplePrompts: ['Buat caption promosi'], sortOrder: 100 },
];

const STYLE_CATALOG = [
  { styleKey: 'normal', name: 'Normal', description: 'Balanced, natural, and clear.', tone: 'neutral', formattingPreference: 'Clear paragraphs and bullets when useful.', sortOrder: 10 },
  { styleKey: 'calm-teacher', name: 'Calm Teacher', description: 'Patient, simple, step-by-step teaching style.', tone: 'calm', formattingPreference: 'Step-by-step with light analogies.', sortOrder: 20 },
  { styleKey: 'professional', name: 'Professional', description: 'Formal and polished for business documents.', tone: 'formal', formattingPreference: 'Structured headings and clean bullets.', sortOrder: 30 },
  { styleKey: 'concise', name: 'Concise', description: 'Short and direct.', tone: 'direct', formattingPreference: 'Minimal bullets.', sortOrder: 40 },
  { styleKey: 'deep-thinker', name: 'Deep Thinker', description: 'Detailed analysis with risks and alternatives.', tone: 'analytical', formattingPreference: 'Sections for options, risks, and recommendation.', sortOrder: 50 },
  { styleKey: 'creative-writer', name: 'Creative Writer', description: 'Creative voice for branding and storytelling.', tone: 'creative', formattingPreference: 'Variations and punchy copy.', sortOrder: 60 },
  { styleKey: 'startup-founder', name: 'Startup Founder', description: 'Product, growth, MVP, pricing, and launch oriented.', tone: 'founder', formattingPreference: 'Actionable strategy and priorities.', sortOrder: 70 },
  { styleKey: 'senior-engineer', name: 'Senior Engineer', description: 'Technical, maintainable, scalable engineering style.', tone: 'technical', formattingPreference: 'Root cause, fix, edge cases, tests.', sortOrder: 80 },
  { styleKey: 'critical-reviewer', name: 'Critical Reviewer', description: 'Finds weaknesses and gives sharp improvements.', tone: 'critical', formattingPreference: 'Issues, impact, fixes.', sortOrder: 90 },
  { styleKey: 'friendly-assistant', name: 'Friendly Assistant', description: 'Friendly and easy to understand.', tone: 'friendly', formattingPreference: 'Natural explanation.', sortOrder: 100 },
  { styleKey: 'research-analyst', name: 'Research Analyst', description: 'Objective, structured, data-driven research style.', tone: 'objective', formattingPreference: 'Summary, key points, evidence, confidence.', sortOrder: 110 },
  { styleKey: 'minimal', name: 'Minimal', description: 'Very short and straight to the point.', tone: 'minimal', formattingPreference: 'Only essentials.', sortOrder: 120 },
  { styleKey: 'motivator', name: 'Motivator', description: 'Supportive, encouraging, and actionable.', tone: 'supportive', formattingPreference: 'Encouraging steps and next action.', sortOrder: 130 },
];

const CONNECTOR_CATALOG = [
  { connectorKey: 'google-drive', name: 'Google Drive', description: 'Read and search Drive files when connected.', category: 'Storage', defaultStatus: 'coming_soon', capabilities: ['search', 'read', 'sync'], permissionSummary: 'Access selected Drive files after connection.', examplePrompts: ['Cari dokumen proposal di Drive'], sortOrder: 10 },
  { connectorKey: 'github', name: 'GitHub', description: 'Use repository context for code tasks.', category: 'Code', defaultStatus: 'disconnected', capabilities: ['search', 'read'], permissionSummary: 'Read selected repositories after connection.', examplePrompts: ['Cek error build repo saya'], sortOrder: 20 },
  { connectorKey: 'gmail', name: 'Gmail', description: 'Search and summarize email context.', category: 'Email', defaultStatus: 'coming_soon', capabilities: ['search', 'read'], permissionSummary: 'Read selected email context after connection.', examplePrompts: ['Ringkas email client minggu ini'], sortOrder: 30 },
  { connectorKey: 'google-calendar', name: 'Google Calendar', description: 'Use schedule context for planning.', category: 'Calendar', defaultStatus: 'coming_soon', capabilities: ['read', 'sync'], permissionSummary: 'Read selected calendar events after connection.', examplePrompts: ['Buat jadwal kerja minggu ini'], sortOrder: 40 },
  { connectorKey: 'notion', name: 'Notion', description: 'Search Notion pages and notes.', category: 'Notes', defaultStatus: 'coming_soon', capabilities: ['search', 'read', 'sync'], permissionSummary: 'Read selected Notion workspace content.', examplePrompts: ['Cari catatan meeting di Notion'], sortOrder: 50 },
  { connectorKey: 'slack', name: 'Slack', description: 'Summarize channel context.', category: 'Communication', defaultStatus: 'coming_soon', capabilities: ['search', 'read'], permissionSummary: 'Read selected Slack channels after connection.', examplePrompts: ['Ringkas diskusi channel produk'], sortOrder: 60 },
  { connectorKey: 'discord', name: 'Discord', description: 'Read community discussion context.', category: 'Community', defaultStatus: 'coming_soon', capabilities: ['search', 'read'], permissionSummary: 'Read selected Discord channels after connection.', examplePrompts: ['Ringkas feedback komunitas'], sortOrder: 70 },
  { connectorKey: 'web-search', name: 'Web Search', description: 'Use web context for research answers.', category: 'Research', defaultStatus: 'connected', capabilities: ['search', 'read', 'deep research'], permissionSummary: 'Use public web search context.', examplePrompts: ['Riset kompetitor AI workspace'], sortOrder: 90 },
  { connectorKey: 'local-documents', name: 'Local Documents', description: 'Use uploaded local documents as context.', category: 'Files', defaultStatus: 'disconnected', capabilities: ['read', 'sync'], permissionSummary: 'Read uploaded user documents.', examplePrompts: ['Rangkum file yang saya upload'], sortOrder: 100 },
];

const seedCollection = async (collectionName, items, keyField) => {
  const batch = db.batch();
  for (const item of items) {
    const ref = catalogRef(collectionName).doc(item[keyField]);
    batch.set(ref, { ...item, enabled: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  await batch.commit();
};

let catalogReady = false;
export async function ensureCatalogSeeded() {
  if (catalogReady) return;
  await Promise.all([
    seedCollection('glassTools', GLASS_TOOLS, 'toolKey'),
    seedCollection('workflowModes', WORKFLOW_MODES, 'modeKey'),
    seedCollection('skills', SKILL_CATALOG, 'skillKey'),
    seedCollection('styles', STYLE_CATALOG, 'styleKey'),
    seedCollection('connectors', CONNECTOR_CATALOG, 'connectorKey'),
  ]);
  catalogReady = true;
}

export const __test = { GLASS_TOOLS, WORKFLOW_MODES, SKILL_CATALOG, STYLE_CATALOG, CONNECTOR_CATALOG };
