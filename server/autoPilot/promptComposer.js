/**
 * Auto Pilot — System Prompt Composer
 *
 * Composes the final system instruction sent to the AI provider, based on
 * the routing decision. Keeps the wording tight and tool-specific.
 */

import { getStyleInstruction } from './styles.js';
import { getSkillInstruction } from './skills.js';

const TOOL_BEHAVIOR = {
  'Glass Chat':
    'You are in conversational mode: answer directly, ground with reasoning, no tool theatre.',
  'Glass Search':
    'You are in research mode: structure findings with claim → evidence → caveat. Distinguish facts from inferences.',
  'Glass Build':
    'You are in build mode: produce production-quality web UI with semantic HTML, accessible markup, and clean Tailwind/React patterns.',
  'Glass Code':
    'You are in code mode: deliver a minimal correct patch. Show the failing line, root cause, fixed code, and a one-line verification step.',
  'Glass Omni':
    'You are in omni mode: combine strategy, research, and execution into a single coherent plan.',
};

const MODE_BEHAVIOR = {
  Think:
    'Lead with reasoning. Surface assumptions and trade-offs before the answer.',
  Research:
    'Be evidence-oriented. Use a structured outline (overview → key findings → comparisons → recommendation).',
  Create:
    'Produce a polished long-form deliverable with clear sections and consistent voice.',
  Build:
    'Produce a single, complete, runnable artifact. Prefer one file unless multi-file is required.',
  Code:
    'Diagnose first, patch second, verify last. No unrelated refactors.',
  Analyze:
    'Critique with rigor: weaknesses → risks → ranked improvements.',
  Launch:
    'Frame as a launch plan: ICP, MVP scope, GTM channels, pricing, milestones.',
  Automate:
    'Frame as an automation: triggers, steps, integrations, failure handling.',
};

const CANVAS_BEHAVIOR = {
  document:
    'Output canvas-ready Markdown for a Document canvas: H1 title, H2/H3 sections, no chat preamble inside the canvas content.',
  web:
    'Output a single self-contained HTML/JSX block ready for a Web canvas. Use Tailwind classes if applicable. No external assets.',
  code:
    'Output a single fenced code block with the language tag set, ready for a Code canvas. No surrounding prose inside the canvas.',
  presentation:
    'Output a slide outline as a Markdown list of slides (## Slide 1: Title, key bullets) ready for a Presentation canvas.',
  general:
    'Output a clean structured Markdown block ready for a General canvas.',
};

/**
 * Compose the full system instruction for AI generation.
 */
export function composeSystemPrompt({
  routing,
  userPrompt,
  projectContext,
  canvasContent,
  manualOverrideApplied,
}) {
  const lines = [];
  lines.push('You are UseGlass AI Auto Pilot.');
  lines.push('Auto Pilot has selected the following configuration for this request:');
  lines.push(`- Tool: ${routing.selectedTool}`);
  lines.push(`- Workflow Mode: ${routing.selectedWorkflowMode}`);
  lines.push(`- Style: ${routing.selectedStyle}`);
  lines.push(`- Skill: ${routing.selectedSkill || 'none'}`);
  lines.push(`- Connector: ${routing.selectedConnector || 'none'}`);
  lines.push(`- Canvas: ${routing.canvasType || 'none'}`);
  lines.push(`- Output Format: ${routing.outputFormat}`);
  if (manualOverrideApplied) {
    lines.push('- Note: the user manually overrode part of this configuration; respect their choice.');
  }
  lines.push('');

  const toolBehavior = TOOL_BEHAVIOR[routing.selectedTool];
  if (toolBehavior) lines.push(toolBehavior);

  const modeBehavior = MODE_BEHAVIOR[routing.selectedWorkflowMode];
  if (modeBehavior) lines.push(modeBehavior);

  const styleInstr = getStyleInstruction(routing.selectedStyle);
  if (styleInstr) lines.push(`Tone & Style: ${styleInstr}`);

  const skillInstr = getSkillInstruction(routing.selectedSkill);
  if (skillInstr) lines.push(`Skill expertise: ${skillInstr}`);

  if (routing.canvasType) {
    const canvasBehavior = CANVAS_BEHAVIOR[routing.canvasType] || CANVAS_BEHAVIOR.general;
    lines.push(canvasBehavior);
  }

  if (routing.connectorNeeded && !routing.selectedConnector) {
    lines.push(
      `The user asked for something that would benefit from the ${routing.missingConnector} connector, but it is NOT connected. Do NOT pretend to have access to external/live data via that connector. Answer with what you know and clearly note that the connector is unavailable.`,
    );
  } else if (!routing.selectedConnector) {
    lines.push(
      'No connectors are active. Do not claim to fetch real-time external data; rely on reasoning and prior knowledge.',
    );
  }

  if (projectContext && Object.keys(projectContext || {}).length > 0) {
    lines.push('');
    lines.push('Project context (treat as authoritative for this user):');
    lines.push(JSON.stringify(projectContext).slice(0, 2000));
  }

  if (canvasContent && typeof canvasContent === 'string' && canvasContent.trim()) {
    lines.push('');
    lines.push('Existing canvas content (the user is editing this; preserve structure unless they ask otherwise):');
    lines.push(canvasContent.slice(0, 4000));
  }

  if (routing.outputFormat === 'pdf') {
    lines.push('');
    lines.push('The user wants a PDF-ready output. Produce well-structured Markdown that converts cleanly to PDF (clear H1, H2, H3, bullet lists, tables where useful).');
  }

  lines.push('');
  lines.push('Return a single response. If a canvas is in play, place the canvas-ready content first; the chat panel will receive a short summary separately.');

  return lines.join('\n');
}

/**
 * Compose a short "chat panel" follow-up message that accompanies a canvas.
 * Used when we need a tiny natural-language summary alongside the artifact.
 */
export function composeChatSummaryHint(routing) {
  if (!routing.canvasType) return null;
  return `Provide a 1-2 sentence summary for the chat panel, then the full ${routing.canvasType} content for the canvas. Separate them with a line containing exactly: ---CANVAS---`;
}
