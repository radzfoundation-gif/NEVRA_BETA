export type GlassToolMode = 'chat' | 'search' | 'builder' | 'code' | 'omni';
export type GlassWorkflowMode = 'think' | 'research' | 'create' | 'build' | 'code' | 'analyze' | 'launch' | 'automate';
export type GlassStyle = 'normal' | 'calm-teacher' | 'professional' | 'concise' | 'deep-thinker' | 'creative-writer' | 'startup-founder' | 'senior-engineer' | 'critical-reviewer' | 'friendly-assistant' | 'research-analyst' | 'minimal' | 'motivator';
export type GlassCanvasType = 'document' | 'web' | 'code' | 'presentation' | 'general' | null;

export type GlassRoutingResult = {
  detectedIntent: 'pdf_document' | 'strategy' | 'research' | 'code_debug' | 'ui_build' | 'chat' | 'analysis' | 'launch' | 'automation' | 'learning' | 'prompt' | 'content';
  selectedTool: GlassToolMode;
  selectedWorkflowMode: GlassWorkflowMode;
  selectedStyle: GlassStyle;
  selectedSkill: string | null;
  selectedConnector: string | null;
  canvasType: GlassCanvasType;
  outputFormat: 'chat' | 'document' | 'pdf' | 'code' | 'strategy' | 'research' | 'ui' | 'checklist' | 'prompt' | 'content' | 'explanation' | 'notes' | 'analysis';
  confidence: number;
  reason: string;
};

type RouterOptions = {
  webSearchConnected?: boolean;
  githubConnected?: boolean;
  localDocumentsConnected?: boolean;
  enabledSkills?: string[];
};

const has = (text: string, words: string[]) => words.some(word => text.includes(word));
const hasRe = (text: string, patterns: RegExp[]) => patterns.some(pattern => pattern.test(text));

const skill = (preferred: string, fallback: string | null, enabled?: string[]) => {
  if (!enabled || enabled.length === 0) return preferred;
  if (enabled.includes(preferred)) return preferred;
  if (fallback && enabled.includes(fallback)) return fallback;
  return null;
};

export function routeGlassIntent(prompt: string, options: RouterOptions = {}): GlassRoutingResult {
  const text = prompt.toLowerCase().trim();
  const enabledSkills = options.enabledSkills;
  const wantsGithub = has(text, ['github', 'repo', 'repository', 'repositori']);
  const longOutput = text.length > 180 || has(text, ['lengkap', 'detail', 'panjang', 'full', 'komprehensif']);

  if (has(text, ['pitch deck', 'slide', 'presentasi', 'presentation', 'deck'])) {
    return { detectedIntent: 'content', selectedTool: 'omni', selectedWorkflowMode: 'create', selectedStyle: 'professional', selectedSkill: skill('Content Creator', 'Brand Copywriter', enabledSkills), selectedConnector: null, canvasType: 'presentation', outputFormat: 'document', confidence: 0.88, reason: 'Prompt meminta materi presentasi atau slide.' };
  }

  if (has(text, ['buatkan pdf', 'buat pdf', 'generate pdf', 'export pdf', 'pdf']) || has(text, ['buat dokumen', 'buat proposal', 'buat makalah', 'buat laporan', 'buat prd', 'buat artikel panjang', 'buat essay', 'buat surat'])) {
    const isAcademic = has(text, ['makalah', 'essay', 'kuliah', 'akademik', 'citation', 'sitasi']);
    const isProduct = has(text, ['prd', 'produk', 'product requirement']);
    const selectedSkill = isAcademic ? skill('Academic Writer', 'Study Assistant', enabledSkills) : isProduct ? skill('PRD Writer', 'Business Analyst', enabledSkills) : skill('Business Analyst', 'Brand Copywriter', enabledSkills);
    return { detectedIntent: 'pdf_document', selectedTool: 'omni', selectedWorkflowMode: isProduct ? 'think' : 'create', selectedStyle: 'professional', selectedSkill, selectedConnector: null, canvasType: 'document', outputFormat: text.includes('pdf') ? 'pdf' : 'document', confidence: 0.94, reason: 'Prompt meminta dokumen/PDF/proposal/PRD sehingga output terbaik berupa Document Canvas.' };
  }

  if (has(text, ['strategy', 'strategi', 'rencana bisnis', 'roadmap', 'launch', 'launching', 'gtm', 'monetization', 'pricing', 'growth', 'market plan', 'startup', 'saas plan']) && !has(text, ['pricing page', 'login page', 'landing page', 'dashboard', 'website', 'halaman web', 'ui', 'component', 'komponen'])) {
    return { detectedIntent: has(text, ['launch', 'launching', 'gtm']) ? 'launch' : 'strategy', selectedTool: 'omni', selectedWorkflowMode: has(text, ['launch', 'launching', 'gtm']) ? 'launch' : 'think', selectedStyle: has(text, ['startup', 'saas', 'growth', 'pricing']) ? 'startup-founder' : 'professional', selectedSkill: skill('SaaS Planner', 'Business Analyst', enabledSkills), selectedConnector: null, canvasType: longOutput ? 'document' : null, outputFormat: has(text, ['checklist']) ? 'checklist' : 'strategy', confidence: 0.9, reason: 'Prompt meminta strategi, roadmap, bisnis, atau launch plan.' };
  }

  if (has(text, ['riset', 'research', 'cari data', 'cari informasi', 'bandingkan', 'kompetitor', 'compare', 'trend', 'trends', 'market research', 'sumber'])) {
    const isAcademic = has(text, ['akademik', 'paper', 'jurnal', 'kuliah', 'citation', 'sitasi']);
    return { detectedIntent: 'research', selectedTool: 'search', selectedWorkflowMode: 'research', selectedStyle: 'research-analyst', selectedSkill: isAcademic ? skill('Academic Writer', 'Business Analyst', enabledSkills) : skill('Business Analyst', 'Academic Writer', enabledSkills), selectedConnector: options.webSearchConnected !== false ? 'Web Search' : null, canvasType: longOutput ? 'document' : null, outputFormat: 'research', confidence: 0.92, reason: 'Prompt meminta riset, perbandingan, tren, sumber, atau data eksternal.' };
  }

  if (has(text, ['error', 'debug', 'fix', 'npm run', 'build failed', 'kode', 'code', 'refactor', 'terminal', 'stack trace', 'bug'])) {
    return { detectedIntent: 'code_debug', selectedTool: 'code', selectedWorkflowMode: 'code', selectedStyle: 'senior-engineer', selectedSkill: skill('Code Debugger', null, enabledSkills), selectedConnector: wantsGithub && options.githubConnected ? 'GitHub' : null, canvasType: has(text, ['component', 'komponen', 'file structure', 'kode panjang', 'refactor']) || longOutput ? 'code' : null, outputFormat: 'code', confidence: 0.93, reason: 'Prompt berisi coding, debugging, error terminal, atau refactor.' };
  }

  if (has(text, ['buat website', 'landing page', 'dashboard', 'ui', 'component', 'komponen', 'app layout', 'halaman web', 'pricing page', 'login page', 'design', 'glassmorphism'])) {
    return { detectedIntent: 'ui_build', selectedTool: 'builder', selectedWorkflowMode: 'build', selectedStyle: has(text, ['saas', 'startup', 'landing']) ? 'startup-founder' : 'creative-writer', selectedSkill: has(text, ['copy', 'headline', 'tagline']) ? skill('Brand Copywriter', 'UI Reviewer', enabledSkills) : skill('UI Reviewer', 'Brand Copywriter', enabledSkills), selectedConnector: null, canvasType: 'web', outputFormat: 'ui', confidence: 0.91, reason: 'Prompt meminta UI, website, halaman, atau komponen visual.' };
  }

  if (has(text, ['review', 'audit', 'kritik', 'cari kelemahan', 'perbaiki', 'evaluasi', 'analisis risiko'])) {
    const selectedSkill = has(text, ['ui', 'design', 'landing']) ? skill('UI Reviewer', 'Business Analyst', enabledSkills) : has(text, ['code', 'kode', 'bug']) ? skill('Code Debugger', 'Business Analyst', enabledSkills) : skill('Business Analyst', 'UI Reviewer', enabledSkills);
    return { detectedIntent: 'analysis', selectedTool: 'chat', selectedWorkflowMode: 'analyze', selectedStyle: 'critical-reviewer', selectedSkill, selectedConnector: null, canvasType: longOutput ? 'document' : null, outputFormat: 'analysis', confidence: 0.88, reason: 'Prompt meminta review, audit, kritik, evaluasi, atau analisis risiko.' };
  }

  if (has(text, ['perbaiki prompt', 'buatkan prompt', 'prompt untuk codex', 'prompt untuk cursor', 'prompt lovable', 'prompt gemini'])) {
    return { detectedIntent: 'prompt', selectedTool: 'chat', selectedWorkflowMode: 'create', selectedStyle: 'professional', selectedSkill: skill('Prompt Engineer', null, enabledSkills), selectedConnector: null, canvasType: longOutput ? 'document' : null, outputFormat: 'prompt', confidence: 0.9, reason: 'Prompt meminta pembuatan atau perbaikan prompt.' };
  }

  if (has(text, ['caption', 'konten', 'script', 'video', 'tiktok', 'instagram', 'copywriting', 'headline', 'tagline'])) {
    return { detectedIntent: 'content', selectedTool: 'chat', selectedWorkflowMode: 'create', selectedStyle: 'creative-writer', selectedSkill: skill('Content Creator', 'Brand Copywriter', enabledSkills), selectedConnector: null, canvasType: longOutput ? 'document' : null, outputFormat: 'content', confidence: 0.88, reason: 'Prompt meminta konten, copywriting, script, atau ide kreatif.' };
  }

  if (has(text, ['jelaskan', 'saya belum paham', 'materi', 'tugas kuliah', 'belajar', 'rangkum', 'buat catatan', 'contoh soal']) || hasRe(text, [/^(apa|what|why|how|kenapa|bagaimana)\s+/])) {
    return { detectedIntent: 'learning', selectedTool: 'chat', selectedWorkflowMode: 'think', selectedStyle: 'calm-teacher', selectedSkill: skill('Study Assistant', 'Academic Writer', enabledSkills), selectedConnector: options.localDocumentsConnected ? 'Local Documents' : null, canvasType: has(text, ['catatan', 'rangkuman', 'rangkum']) || longOutput ? 'document' : null, outputFormat: has(text, ['catatan', 'rangkum']) ? 'notes' : 'explanation', confidence: 0.86, reason: 'Prompt bernada belajar, penjelasan, materi, atau rangkuman.' };
  }

  if (has(text, ['otomatis', 'automation', 'automate', 'sop', 'workflow', 'task chain', 'follow-up'])) {
    return { detectedIntent: 'automation', selectedTool: 'omni', selectedWorkflowMode: 'automate', selectedStyle: 'professional', selectedSkill: skill('Business Analyst', 'SaaS Planner', enabledSkills), selectedConnector: null, canvasType: 'document', outputFormat: 'checklist', confidence: 0.84, reason: 'Prompt meminta workflow automation, SOP, atau task chain.' };
  }

  return { detectedIntent: 'chat', selectedTool: 'chat', selectedWorkflowMode: 'think', selectedStyle: 'friendly-assistant', selectedSkill: null, selectedConnector: null, canvasType: null, outputFormat: 'chat', confidence: 0.62, reason: 'Tidak ada intent khusus; gunakan percakapan umum dengan gaya ramah.' };
}

export const routingToolToGlassMode = (tool: GlassToolMode) => tool;
