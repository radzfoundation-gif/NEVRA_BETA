/**
 * Auto Pilot — Routing Rules
 *
 * Each rule maps a keyword bag to a routing decision. The first rule whose
 * keywords are present in the prompt wins. Rules are ordered from most
 * specific to most generic.
 *
 * Each rule returns a partial routing decision. Skill is chosen by the
 * router based on `skillPriority` + the prompt + enabledSkills.
 */

const KW = (...words) => words.map((w) => w.toLowerCase());

export const RULES = [
  // ─── A. PDF / Documents / Proposals / Reports ───────────────────────────
  {
    id: 'pdf_document',
    keywords: KW(
      'buatkan pdf', 'buat pdf', 'generate pdf', 'export pdf',
      'buat dokumen', 'buatkan dokumen', 'buatkan document',
      'buat proposal', 'buatkan proposal',
      'buat makalah', 'buatkan makalah',
      'buat laporan', 'buatkan laporan',
      'buat prd', 'buatkan prd',
      'buat artikel panjang', 'buat essay', 'buat esai',
      'buat surat', 'buatkan surat',
    ),
    decision: {
      detectedIntent: 'document_creation',
      selectedTool: 'Glass Chat',
      selectedWorkflowMode: 'Create',
      selectedStyle: 'Professional',
      canvasHint: 'document',
      outputFormat: 'document', // upgraded to 'pdf' if user explicitly asks PDF
      skillPriority: ['PRD Writer', 'Academic Writer', 'Business Analyst'],
      reason: 'Prompt requests a long-form document; routing to Create mode with Document canvas.',
    },
  },

  // ─── B. Strategy / Business / Roadmap / Launch / GTM ────────────────────
  {
    id: 'strategy_launch',
    keywords: KW(
      'strategy', 'strategi', 'rencana bisnis', 'roadmap',
      'launch ', 'launching', 'gtm', 'go-to-market',
      'monetization', 'monetisasi', 'pricing strategy',
      'growth plan', 'market plan', 'startup plan',
      'saas plan', 'business plan',
    ),
    decision: {
      detectedIntent: 'strategy_planning',
      selectedTool: 'Glass Omni',
      selectedWorkflowMode: 'Launch',
      selectedStyle: 'Startup Founder',
      canvasHint: 'document',
      outputFormat: 'strategy',
      skillPriority: ['SaaS Planner', 'Business Analyst'],
      reason: 'Prompt is about strategy or launch; routing to Glass Omni + Launch mode.',
    },
  },

  // ─── C. Research / Compare / Market / Sources ───────────────────────────
  {
    id: 'research_compare',
    keywords: KW(
      'riset', 'research', 'cari data', 'cari informasi',
      'bandingkan', 'compare', 'kompetitor', 'competitor',
      'trend', 'market research', 'sumber', 'data terbaru',
      'analisis pasar', 'pasar',
    ),
    decision: {
      detectedIntent: 'research',
      selectedTool: 'Glass Search',
      selectedWorkflowMode: 'Research',
      selectedStyle: 'Research Analyst',
      canvasHint: 'document',
      outputFormat: 'research',
      connectorHint: 'Web Search',
      skillPriority: ['Business Analyst', 'Academic Writer'],
      reason: 'Prompt asks for research/comparison; routing to Glass Search.',
    },
  },

  // ─── D. Code / Errors / Debug / Refactor ────────────────────────────────
  {
    id: 'coding_debug',
    keywords: KW(
      'error', 'debug', 'fix', 'npm run', 'yarn run', 'pnpm run',
      'build failed', 'build error', 'kode', 'refactor',
      'component error', 'terminal', 'stack trace', 'bug',
      'tsc', 'typescript error', 'compile error', 'crash',
    ),
    decision: {
      detectedIntent: 'coding',
      selectedTool: 'Glass Code',
      selectedWorkflowMode: 'Code',
      selectedStyle: 'Senior Engineer',
      canvasHint: 'code',
      outputFormat: 'code',
      connectorHint: 'GitHub', // only used if connected AND prompt mentions repo
      skillPriority: ['Code Debugger'],
      reason: 'Prompt is about code/errors; routing to Glass Code.',
    },
  },

  // ─── E. UI / Website / Landing / Component ──────────────────────────────
  {
    id: 'ui_build',
    keywords: KW(
      'buat website', 'buatkan website', 'landing page', 'dashboard',
      'buat ui', ' ui ', 'component', 'komponen',
      'app layout', 'halaman web', 'pricing page', 'login page',
      'signup page', 'sign up page', 'design', 'glassmorphism',
    ),
    decision: {
      detectedIntent: 'ui_build',
      selectedTool: 'Glass Build',
      selectedWorkflowMode: 'Build',
      selectedStyle: 'Startup Founder',
      canvasHint: 'web',
      outputFormat: 'ui',
      skillPriority: ['UI Reviewer', 'Brand Copywriter'],
      reason: 'Prompt asks for a UI/web build; routing to Glass Build with Web canvas.',
    },
  },

  // ─── F. Learn / Explain / Study ─────────────────────────────────────────
  {
    id: 'learn_explain',
    keywords: KW(
      'jelaskan', 'saya belum paham', 'belum paham',
      'materi', 'tugas kuliah', 'belajar', 'rangkum',
      'buat catatan', 'contoh soal', 'pembahasan',
    ),
    decision: {
      detectedIntent: 'learning',
      selectedTool: 'Glass Chat',
      selectedWorkflowMode: 'Think',
      selectedStyle: 'Calm Teacher',
      canvasHint: null,
      outputFormat: 'notes',
      skillPriority: ['Study Assistant', 'Academic Writer'],
      reason: 'Prompt is a learning/explanation request; routing to Calm Teacher.',
    },
  },

  // ─── G. Review / Audit / Critique ───────────────────────────────────────
  {
    id: 'review_audit',
    keywords: KW(
      'review', 'audit', 'kritik', 'cari kelemahan',
      'perbaiki', 'evaluasi', 'analisis risiko', 'risk assessment',
    ),
    decision: {
      detectedIntent: 'review',
      selectedTool: 'Glass Chat',
      selectedWorkflowMode: 'Analyze',
      selectedStyle: 'Critical Reviewer',
      canvasHint: null,
      outputFormat: 'analysis',
      skillPriority: ['Business Analyst', 'UI Reviewer', 'Code Debugger'],
      reason: 'Prompt asks for review/critique; routing to Analyze mode.',
    },
  },

  // ─── H. Prompt Engineering ──────────────────────────────────────────────
  {
    id: 'prompt_engineering',
    keywords: KW(
      'perbaiki prompt', 'buatkan prompt', 'buat prompt',
      'prompt untuk codex', 'prompt untuk cursor',
      'prompt lovable', 'prompt gemini', 'prompt claude code',
      'system prompt', 'rewrite prompt',
    ),
    decision: {
      detectedIntent: 'prompt_engineering',
      selectedTool: 'Glass Chat',
      selectedWorkflowMode: 'Create',
      selectedStyle: 'Professional',
      canvasHint: 'document',
      outputFormat: 'prompt',
      skillPriority: ['Prompt Engineer'],
      reason: 'Prompt asks to design or refine an AI prompt.',
    },
  },

  // ─── I. Content / Caption / Script ──────────────────────────────────────
  {
    id: 'content_creation',
    keywords: KW(
      'caption', 'konten', 'script', 'video script', 'tiktok',
      'instagram', 'reels', 'short ', 'youtube short', 'artikel',
      'copywriting', 'headline', 'tagline', 'hook',
    ),
    decision: {
      detectedIntent: 'content_creation',
      selectedTool: 'Glass Chat',
      selectedWorkflowMode: 'Create',
      selectedStyle: 'Creative Writer',
      canvasHint: null,
      outputFormat: 'content',
      skillPriority: ['Content Creator', 'Brand Copywriter'],
      reason: 'Prompt asks for content/copy; routing to Creative Writer.',
    },
  },
];

/**
 * Find the first rule whose any-keyword matches the lowercased prompt.
 * Returns { rule, matchedKeyword } or null.
 */
export function matchRule(promptLower) {
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (promptLower.includes(kw)) {
        return { rule, matchedKeyword: kw };
      }
    }
  }
  return null;
}

export const FALLBACK_DECISION = {
  detectedIntent: 'general_chat',
  selectedTool: 'Glass Chat',
  selectedWorkflowMode: 'Think',
  selectedStyle: 'Friendly Assistant',
  canvasHint: null,
  outputFormat: 'chat',
  skillPriority: [],
  reason: 'No specific intent detected; using a general response mode.',
};
