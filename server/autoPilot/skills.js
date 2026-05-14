/**
 * Auto Pilot — Skill Registry
 *
 * Each skill has a category, useFor description, keyword triggers, and a
 * domain-specific instruction snippet that is injected into the composed
 * system prompt when that skill is selected.
 */

export const SKILL_REGISTRY = {
  'PRD Writer': {
    category: 'Product',
    useFor: 'PRD, product requirements, feature spec, roadmap, user stories, acceptance criteria',
    keywords: [
      'prd', 'product requirement', 'feature spec', 'spec produk',
      'user story', 'acceptance criteria', 'product brief', 'epic',
    ],
    instruction:
      'Apply senior PM rigor: write a PRD-style structure with Problem, Goals, Non-Goals, User Stories, Acceptance Criteria, Risks, and Success Metrics. Keep language unambiguous.',
  },
  'SaaS Planner': {
    category: 'Business',
    useFor: 'SaaS ideas, product launch, pricing, MVP, go-to-market, monetization',
    keywords: [
      'saas', 'mvp', 'pricing', 'monetization', 'monetisasi',
      'go-to-market', 'gtm', 'launch plan', 'business model', 'pivot',
    ],
    instruction:
      'Think like a SaaS founder. Map ICP, pricing tiers, MVP scope, GTM channels, retention loops, and the smallest first launch milestone.',
  },
  'UI Reviewer': {
    category: 'Design',
    useFor: 'UI review, UX audit, hierarchy, accessibility, polish',
    keywords: [
      'ui review', 'ux audit', 'design review', 'hierarchy', 'a11y',
      'accessibility', 'kontras', 'spasi', 'spacing', 'visual polish',
    ],
    instruction:
      'Audit the UI for hierarchy, contrast, spacing, alignment, accessibility (WCAG-AA), and visual polish. Provide concrete fixes with priority.',
  },
  'Code Debugger': {
    category: 'Code',
    useFor: 'errors, bugs, stack traces, terminal logs, failed builds, refactor',
    keywords: [
      'error', 'bug', 'stack trace', 'traceback', 'failed', 'gagal build',
      'npm run', 'yarn', 'pnpm', 'tsc', 'compilation', 'crash', 'exception',
      'segfault', 'undefined is not', 'cannot read', 'panic',
    ],
    instruction:
      'Diagnose root cause first. Show the failing line, explain why, then provide a minimal correct patch. Do not suggest unrelated refactors.',
  },
  'Academic Writer': {
    category: 'Writing',
    useFor: 'academic answers, essays, reports, citations guidance, college tasks',
    keywords: [
      'makalah', 'essay', 'esai', 'tugas kuliah', 'skripsi', 'thesis',
      'jurnal', 'paper', 'sitasi', 'citation', 'daftar pustaka', 'abstrak',
    ],
    instruction:
      'Write in formal academic register with clear thesis, structured paragraphs, and explicit reasoning. Suggest citation style (APA/IEEE) where relevant; do not fabricate citations.',
  },
  'Brand Copywriter': {
    category: 'Marketing',
    useFor: 'landing page copy, tagline, headline, campaign, brand messaging',
    keywords: [
      'tagline', 'headline', 'copywriting', 'brand voice', 'campaign',
      'slogan', 'value proposition', 'hero copy', 'cta',
    ],
    instruction:
      'Write punchy, on-brand copy. Lead with value, keep sentences short, vary rhythm, and offer 2-3 alternatives for each headline/CTA.',
  },
  'Prompt Engineer': {
    category: 'AI',
    useFor: 'prompt creation, prompt improvement, codex prompt, cursor prompt, claude code prompt',
    keywords: [
      'prompt', 'system prompt', 'codex prompt', 'cursor prompt',
      'lovable prompt', 'claude code prompt', 'gemini prompt', 'rewrite prompt',
      'perbaiki prompt', 'buatkan prompt',
    ],
    instruction:
      'Produce a clean, structured prompt: Role, Context, Task, Constraints, Output Format. Use second person, avoid fluff, and target the named tool (Codex/Cursor/Claude/Lovable/Gemini) when specified.',
  },
  'Business Analyst': {
    category: 'Business',
    useFor: 'market analysis, competitor analysis, SWOT, risks, strategy',
    keywords: [
      'kompetitor', 'competitor', 'market', 'swot', 'risk', 'risiko',
      'analisis bisnis', 'business analysis', 'tam', 'sam', 'som',
    ],
    instruction:
      'Approach as a business analyst: structure the answer with markets, segments, competitors, risks, and recommendations backed by reasoning, not hype.',
  },
  'Study Assistant': {
    category: 'Learning',
    useFor: 'explanations, study plan, notes, simplified learning',
    keywords: [
      'jelaskan', 'belum paham', 'rangkum', 'ringkasan', 'catatan',
      'belajar', 'contoh soal', 'pembahasan', 'materi',
    ],
    instruction:
      'Teach step by step. Start with intuition, then a concrete example, then the formal definition. Add a 3-line summary and 2 practice questions.',
  },
  'Content Creator': {
    category: 'Content',
    useFor: 'captions, scripts, content plan, social media content',
    keywords: [
      'caption', 'konten', 'content plan', 'script', 'tiktok', 'reels',
      'instagram', 'youtube short', 'thread', 'twitter', 'x post',
    ],
    instruction:
      'Write platform-aware content: hook in first line, payoff in middle, clear CTA at end. Suggest 3 hook variations and a hashtag set.',
  },
};

const BUILTIN_SKILL_NAMES = Object.keys(SKILL_REGISTRY);

/**
 * Score skills by counting keyword hits in the lowercased prompt.
 * Returns array sorted desc by score.
 */
export function scoreSkills(promptLower) {
  const scores = [];
  for (const [name, skill] of Object.entries(SKILL_REGISTRY)) {
    let score = 0;
    for (const kw of skill.keywords) {
      if (promptLower.includes(kw)) score += 1;
    }
    if (score > 0) scores.push({ name, score, skill });
  }
  scores.sort((a, b) => b.score - a.score);
  return scores;
}

/**
 * Pick the best skill among `candidates` (array of skill names) that is
 * also enabled. If `enabledSkills` is empty/null, all built-in skills are
 * considered enabled.
 */
export function pickEnabledSkill(candidates, enabledSkills) {
  const enabled = (Array.isArray(enabledSkills) && enabledSkills.length > 0)
    ? new Set(enabledSkills)
    : new Set(BUILTIN_SKILL_NAMES);
  for (const name of candidates) {
    if (name && enabled.has(name)) return name;
  }
  return null;
}

export function getSkillInstruction(skillName) {
  if (!skillName) return null;
  const skill = SKILL_REGISTRY[skillName];
  return skill ? skill.instruction : null;
}
