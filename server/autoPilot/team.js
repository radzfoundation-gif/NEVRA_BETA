/**
 * Auto Pilot Team — Multi-workstream Composer
 *
 * For complex prompts that benefit from multiple "workstreams" (Research,
 * Strategy, Build/Code, Review), Auto Pilot Team produces a single coherent
 * deliverable that internally treats each workstream as a section.
 *
 * Detection is conservative: simple prompts MUST stay simple. We only flip
 * to team mode when prompt length AND intent AND explicit "comprehensive"
 * cues co-occur, OR the user explicitly asks for an end-to-end deliverable.
 */

const COMPLEX_INTENTS = new Set([
  'document_creation',
  'pdf_document',
  'strategy_planning',
  'strategy',
  'launch',
  'ui_build',
  'research',
]);

const COMPREHENSIVE_HINTS = [
  'lengkap', 'komprehensif', 'comprehensive', 'end-to-end', 'end to end',
  'full plan', 'rencana lengkap', 'menyeluruh', 'detail',
  'dari nol sampai launch', 'dari awal sampai',
  'plus roadmap', 'plus strategi', 'plus copywriting',
];

const EXPLICIT_TEAM_HINTS = [
  'auto pilot team', 'autopilot team',
  'tim auto pilot', 'tim ai',
  'workstream', 'multi workstream', 'multi-workstream',
  'audit produk lengkap', 'full product audit',
  'prd plus roadmap', 'prd dan roadmap dan',
];

const MIN_TEAM_PROMPT_LEN = 160;
const MIN_TEAM_PROMPT_LEN_EXPLICIT = 40;

function any(text, hints) {
  return hints.some((h) => text.includes(h));
}

/**
 * Decide whether this prompt benefits from Auto Pilot Team.
 *
 * Returns { activate, reason, workstreams[] }
 */
export function detectTeamActivation({ promptLower, routing }) {
  const explicit = any(promptLower, EXPLICIT_TEAM_HINTS);
  const comprehensive = any(promptLower, COMPREHENSIVE_HINTS);
  const longEnough = promptLower.length >= MIN_TEAM_PROMPT_LEN;
  const longEnoughExplicit = promptLower.length >= MIN_TEAM_PROMPT_LEN_EXPLICIT;
  const intentComplex = !!routing && COMPLEX_INTENTS.has(routing.detectedIntent);

  if (explicit && longEnoughExplicit) {
    return {
      activate: true,
      reason: 'User explicitly requested an Auto Pilot Team / multi-workstream output.',
      workstreams: pickWorkstreams(routing),
    };
  }

  if (longEnough && intentComplex && comprehensive) {
    return {
      activate: true,
      reason: 'Prompt is long, intent is complex, and user asked for a comprehensive end-to-end deliverable.',
      workstreams: pickWorkstreams(routing),
    };
  }

  return { activate: false, reason: null, workstreams: [] };
}

/**
 * Choose a relevant subset of workstreams based on the underlying routing.
 * Order matters — sections will be rendered in this order.
 */
function pickWorkstreams(routing) {
  const intent = routing?.detectedIntent;
  if (!intent) return ['Research', 'Strategy', 'Review'];

  switch (intent) {
    case 'ui_build':
      return ['Research', 'Strategy', 'Build', 'Review'];
    case 'coding':
    case 'code_debug':
      return ['Research', 'Code', 'Review'];
    case 'strategy_planning':
    case 'strategy':
    case 'launch':
      return ['Research', 'Strategy', 'Launch', 'Review'];
    case 'document_creation':
    case 'pdf_document':
      return ['Research', 'Strategy', 'Review'];
    case 'research':
      return ['Research', 'Strategy', 'Review'];
    default:
      return ['Research', 'Strategy', 'Review'];
  }
}

const WORKSTREAM_BRIEFS = {
  Research:
    'Research workstream: surface the relevant facts, market context, comparable examples, and unknowns. Distinguish facts from inferences.',
  Strategy:
    'Strategy workstream: convert findings into positioning, decisions, and prioritized milestones. Surface trade-offs.',
  Build:
    'Build workstream: produce the concrete UI/component output (HTML/JSX) ready for the Web canvas. Self-contained.',
  Code:
    'Code workstream: produce a minimal correct patch or implementation. Show the failing path, fix, and a one-line verification.',
  Launch:
    'Launch workstream: ICP, MVP scope, GTM channels, pricing tiers, retention loops, and the smallest first launch milestone.',
  Review:
    'Review workstream: critique what was produced above. Risks, gaps, and ranked improvements (impact × effort).',
};

/**
 * Build a system-prompt addendum that turns a single AI generation into a
 * coherent multi-section deliverable. Designed to be appended AFTER the base
 * Auto Pilot system prompt produced by `composeSystemPrompt`.
 */
export function composeTeamAddendum({ workstreams = [], routing }) {
  if (!workstreams.length) return '';

  const lines = [];
  lines.push('');
  lines.push('— Auto Pilot Team mode is active —');
  lines.push(
    'Treat this single response as a coordinated multi-workstream output. Use the section order below verbatim. Each section must stand on its own and reference earlier sections by name when relevant. Do not merge sections.',
  );
  lines.push('');
  lines.push('Workstreams (in this order):');
  for (const w of workstreams) {
    const brief = WORKSTREAM_BRIEFS[w] || `${w} workstream.`;
    lines.push(`  • ${w} — ${brief}`);
  }
  lines.push('');
  lines.push(
    'Output structure: render each workstream as an H2 section with the workstream name. Within each section, keep the style, skill, and tool behavior already chosen by Auto Pilot. End with a final H2 "Synthesis" section: 3-5 bullets summarizing the strongest decisions and the immediate next action.',
  );

  if (routing?.canvasType === 'document') {
    lines.push(
      'Place all sections inside the Document canvas. The chat panel will receive a 1-2 sentence summary separately.',
    );
  }

  return lines.join('\n');
}
