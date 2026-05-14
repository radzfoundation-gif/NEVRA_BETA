/**
 * Auto Pilot — Main Router
 *
 * Pure function: prompt + context → routing decision.
 * Manual overrides (from frontend) are applied last and never override
 * required safety (e.g. cannot select a coming-soon connector).
 */

import { matchRule, FALLBACK_DECISION } from './rules.js';
import { scoreSkills, pickEnabledSkill } from './skills.js';
import { detectCanvas } from './canvasDetector.js';
import { selectConnector, isComingSoon } from './connectors.js';
import { isValidStyle } from './styles.js';

const VALID_TOOLS = new Set(['Glass Chat', 'Glass Search', 'Glass Build', 'Glass Code', 'Glass Omni']);
const VALID_MODES = new Set(['Think', 'Research', 'Create', 'Build', 'Code', 'Analyze', 'Launch', 'Automate']);
const VALID_CANVAS = new Set(['document', 'web', 'code', 'presentation', 'general']);

function deriveOutputFormat({ ruleFormat, wantsPdf, canvasType }) {
  if (wantsPdf) return 'pdf';
  if (ruleFormat) return ruleFormat;
  if (canvasType === 'web') return 'ui';
  if (canvasType === 'code') return 'code';
  if (canvasType === 'document') return 'document';
  if (canvasType === 'presentation') return 'presentation';
  return 'chat';
}

function deriveCanvasTitle(promptOriginal, canvasType) {
  if (!canvasType) return null;
  const trimmed = (promptOriginal || '').replace(/\s+/g, ' ').trim();
  const head = trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
  const prefix = {
    document: 'Document',
    web: 'Web Canvas',
    code: 'Code',
    presentation: 'Presentation',
    general: 'Canvas',
  }[canvasType] || 'Canvas';
  return head ? `${prefix}: ${head}` : prefix;
}

function clampConfidence(rule, matched) {
  if (!rule) return 0.5;
  return matched ? 0.85 : 0.6;
}

/**
 * Run Auto Pilot routing.
 *
 * @param {Object} params
 * @param {string} params.prompt
 * @param {Object} [params.context]
 * @param {Object} [params.manualOverride]
 * @returns {Object} routing decision
 */
export function runAutoPilot({ prompt, context = {}, manualOverride = {} } = {}) {
  const promptOriginal = typeof prompt === 'string' ? prompt : '';
  const promptLower = promptOriginal.toLowerCase();

  const matched = matchRule(promptLower);
  const baseDecision = matched ? matched.rule.decision : FALLBACK_DECISION;
  let confidence = clampConfidence(matched, !!matched);

  // Canvas detection (rule hint can force; otherwise heuristic)
  const { canvasType: detectedCanvas, wantsPdf } = detectCanvas({
    promptLower,
    intentHint: baseDecision.canvasHint || null,
  });
  let canvasType = detectedCanvas;

  // Output format
  let outputFormat = deriveOutputFormat({
    ruleFormat: baseDecision.outputFormat,
    wantsPdf,
    canvasType,
  });

  // Skill selection from rule's priority list, scoped to enabledSkills
  const enabledSkills = Array.isArray(context.enabledSkills) ? context.enabledSkills : [];
  let candidateSkills = [...(baseDecision.skillPriority || [])];

  // Augment with prompt-scored skills as fallback
  const scored = scoreSkills(promptLower).map((s) => s.name);
  for (const name of scored) {
    if (!candidateSkills.includes(name)) candidateSkills.push(name);
  }

  let selectedSkill = pickEnabledSkill(candidateSkills, enabledSkills);

  // Connector selection
  const connectorPick = selectConnector({
    promptLower,
    availableConnectors: context.availableConnectors,
    hint: baseDecision.connectorHint || null,
    hasUploadedDocument: !!context.canvasContent || !!context.hasUploadedDocument,
  });

  let selectedConnector = connectorPick.selected;
  let connectorNeeded = !!connectorPick.needed;
  let missingConnector = connectorPick.missing;

  // Style — keep what rule chose
  let selectedStyle = baseDecision.selectedStyle;
  let selectedTool = baseDecision.selectedTool;
  let selectedWorkflowMode = baseDecision.selectedWorkflowMode;
  let detectedIntent = baseDecision.detectedIntent;
  let reason = baseDecision.reason;

  // ── Manual override handling ────────────────────────────────────────────
  const overrideNotes = [];
  if (manualOverride && typeof manualOverride === 'object') {
    if (manualOverride.selectedTool && VALID_TOOLS.has(manualOverride.selectedTool)) {
      selectedTool = manualOverride.selectedTool;
      overrideNotes.push(`tool=${selectedTool}`);
    }
    if (manualOverride.selectedWorkflowMode && VALID_MODES.has(manualOverride.selectedWorkflowMode)) {
      selectedWorkflowMode = manualOverride.selectedWorkflowMode;
      overrideNotes.push(`mode=${selectedWorkflowMode}`);
    }
    if (manualOverride.selectedStyle && isValidStyle(manualOverride.selectedStyle)) {
      selectedStyle = manualOverride.selectedStyle;
      overrideNotes.push(`style=${selectedStyle}`);
    }
    if (manualOverride.selectedSkill !== undefined) {
      if (manualOverride.selectedSkill === null) {
        selectedSkill = null;
      } else {
        const overridden = pickEnabledSkill([manualOverride.selectedSkill], enabledSkills);
        if (overridden) {
          selectedSkill = overridden;
          overrideNotes.push(`skill=${selectedSkill}`);
        }
      }
    }
    if (manualOverride.selectedConnector !== undefined) {
      if (manualOverride.selectedConnector === null) {
        selectedConnector = null;
      } else if (!isComingSoon(manualOverride.selectedConnector)) {
        // Only honor connector override if it's actually connected.
        const reCheck = selectConnector({
          promptLower,
          availableConnectors: context.availableConnectors,
          hint: manualOverride.selectedConnector,
          hasUploadedDocument: !!context.canvasContent,
        });
        if (reCheck.selected) {
          selectedConnector = reCheck.selected;
          overrideNotes.push(`connector=${selectedConnector}`);
        }
      }
    }
    if (manualOverride.canvasType !== undefined) {
      if (manualOverride.canvasType === null) {
        canvasType = null;
      } else if (VALID_CANVAS.has(manualOverride.canvasType)) {
        canvasType = manualOverride.canvasType;
        outputFormat = deriveOutputFormat({
          ruleFormat: baseDecision.outputFormat,
          wantsPdf,
          canvasType,
        });
        overrideNotes.push(`canvas=${canvasType}`);
      }
    }
  }

  if (overrideNotes.length > 0) {
    reason = `${reason} (User override: ${overrideNotes.join(', ')}.)`;
  }

  if (!matched && overrideNotes.length === 0) {
    reason = `${reason} Auto Pilot selected a general response mode.`;
  }

  return {
    detectedIntent,
    selectedTool,
    selectedWorkflowMode,
    selectedStyle,
    selectedSkill,
    selectedConnector,
    canvasType,
    canvasTitle: deriveCanvasTitle(promptOriginal, canvasType),
    outputFormat,
    confidence,
    connectorNeeded,
    missingConnector,
    reason,
    manualOverrideApplied: overrideNotes.length > 0,
  };
}

/**
 * Returns a safe fallback routing object for error paths.
 */
export function fallbackRouting(reasonText = 'Routing failed; using safe fallback.') {
  return {
    detectedIntent: 'general_chat',
    selectedTool: 'Glass Chat',
    selectedWorkflowMode: 'Think',
    selectedStyle: 'Friendly Assistant',
    selectedSkill: null,
    selectedConnector: null,
    canvasType: null,
    canvasTitle: null,
    outputFormat: 'chat',
    confidence: 0.3,
    connectorNeeded: false,
    missingConnector: null,
    reason: reasonText,
    manualOverrideApplied: false,
  };
}
