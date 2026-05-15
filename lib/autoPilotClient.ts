/**
 * Auto Pilot Client
 *
 * Thin fetch wrapper for the backend Auto Pilot endpoints
 * (`POST /api/auto-pilot/route` and `POST /api/auto-pilot/generate`).
 *
 * Backend is the source of truth for routing once the network call lands.
 * The local `routeGlassIntent` (lib/glassAutoRouter.ts) is still used for
 * instant optimistic chips before the backend response arrives.
 *
 * Backend uses TitleCase ('Glass Chat', 'Think', 'Senior Engineer'); the
 * existing frontend uses lowercase/kebab-case identifiers. This module
 * normalizes between the two so callers can keep using the local types.
 */

import {
  GlassRoutingResult,
  GlassToolMode,
  GlassWorkflowMode,
  GlassStyle,
  GlassCanvasType,
} from './glassAutoRouter';
import { getApiUrl } from './utils';

const TIMEOUT_MS = 8_000;

type BackendRoutingRaw = {
  detectedIntent?: string;
  selectedTool?: string;
  selectedWorkflowMode?: string;
  selectedStyle?: string;
  selectedSkill?: string | null;
  selectedConnector?: string | null;
  canvasType?: string | null;
  canvasTitle?: string | null;
  outputFormat?: string;
  confidence?: number;
  connectorNeeded?: boolean;
  missingConnector?: string | null;
  reason?: string;
  manualOverrideApplied?: boolean;
};

const TOOL_MAP: Record<string, GlassToolMode> = {
  'Glass Chat': 'chat',
  'Glass Search': 'search',
  'Glass Build': 'builder',
  'Glass Code': 'code',
  'Glass Omni': 'omni',
};

const WORKFLOW_MAP: Record<string, GlassWorkflowMode> = {
  Think: 'think',
  Research: 'research',
  Create: 'create',
  Build: 'build',
  Code: 'code',
  Analyze: 'analyze',
  Launch: 'launch',
  Automate: 'automate',
};

const STYLE_MAP: Record<string, GlassStyle> = {
  Normal: 'normal',
  'Calm Teacher': 'calm-teacher',
  Professional: 'professional',
  Concise: 'concise',
  'Deep Thinker': 'deep-thinker',
  'Creative Writer': 'creative-writer',
  'Startup Founder': 'startup-founder',
  'Senior Engineer': 'senior-engineer',
  'Critical Reviewer': 'critical-reviewer',
  'Friendly Assistant': 'friendly-assistant',
  'Research Analyst': 'research-analyst',
  Minimal: 'minimal',
  Motivator: 'motivator',
};

const INTENT_MAP: Record<string, GlassRoutingResult['detectedIntent']> = {
  document_creation: 'pdf_document',
  pdf_document: 'pdf_document',
  strategy_planning: 'strategy',
  strategy: 'strategy',
  research: 'research',
  coding: 'code_debug',
  code_debug: 'code_debug',
  ui_build: 'ui_build',
  general_chat: 'chat',
  chat: 'chat',
  review: 'analysis',
  analysis: 'analysis',
  launch: 'launch',
  automation: 'automation',
  learning: 'learning',
  prompt_engineering: 'prompt',
  prompt: 'prompt',
  content_creation: 'content',
  content: 'content',
};

const VALID_CANVAS = new Set<GlassCanvasType>([
  'document',
  'web',
  'code',
  'presentation',
  'general',
]);

const VALID_OUTPUT: GlassRoutingResult['outputFormat'][] = [
  'chat',
  'document',
  'pdf',
  'code',
  'strategy',
  'research',
  'ui',
  'checklist',
  'prompt',
  'content',
  'explanation',
  'notes',
  'analysis',
];

function normalizeRouting(raw: BackendRoutingRaw): GlassRoutingResult {
  const tool = (raw.selectedTool && TOOL_MAP[raw.selectedTool]) || 'chat';
  const workflow =
    (raw.selectedWorkflowMode && WORKFLOW_MAP[raw.selectedWorkflowMode]) ||
    'think';
  const style =
    (raw.selectedStyle && STYLE_MAP[raw.selectedStyle]) || 'friendly-assistant';
  const intent =
    (raw.detectedIntent && INTENT_MAP[raw.detectedIntent]) || 'chat';
  const canvas: GlassCanvasType =
    raw.canvasType && VALID_CANVAS.has(raw.canvasType as GlassCanvasType)
      ? (raw.canvasType as GlassCanvasType)
      : null;
  const output = (VALID_OUTPUT.includes(
    (raw.outputFormat as GlassRoutingResult['outputFormat']) ?? 'chat',
  )
    ? raw.outputFormat
    : 'chat') as GlassRoutingResult['outputFormat'];

  return {
    detectedIntent: intent,
    selectedTool: tool,
    selectedWorkflowMode: workflow,
    selectedStyle: style,
    selectedSkill: raw.selectedSkill ?? null,
    selectedConnector: raw.selectedConnector ?? null,
    canvasType: canvas,
    outputFormat: output,
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5,
    reason: raw.reason || 'Auto Pilot routing.',
  };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export type AutoPilotRouteContext = {
  webSearchConnected?: boolean;
  githubConnected?: boolean;
  localDocumentsConnected?: boolean;
  enabledSkills?: string[];
  availableConnectors?: Array<
    string | { name: string; connected?: boolean; status?: string }
  >;
  hasUploadedDocument?: boolean;
};

export type AutoPilotRouteOptions = {
  prompt: string;
  context?: AutoPilotRouteContext;
  manualOverride?: Record<string, unknown>;
  signal?: AbortSignal;
};

export type AutoPilotTeamInfo = {
  activate: boolean;
  reason: string | null;
  workstreams: string[];
};

export type AutoPilotRouteResponse = {
  success: boolean;
  routing: GlassRoutingResult;
  team?: AutoPilotTeamInfo;
  warning?: string;
};

/**
 * POST /api/auto-pilot/route
 * Returns a normalized routing decision compatible with `GlassRoutingResult`.
 * Throws on network/HTTP failure so callers can fall back to the local router.
 */
export async function fetchAutoPilotRouting(
  options: AutoPilotRouteOptions,
): Promise<AutoPilotRouteResponse> {
  const { prompt, context = {}, manualOverride } = options;
  const url = `${getApiUrl()}/api/auto-pilot/route`;

  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context, manualOverride }),
    },
    TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(`auto-pilot/route failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    success: boolean;
    routing: BackendRoutingRaw;
    team?: AutoPilotTeamInfo;
    warning?: string;
  };

  return {
    success: !!data.success,
    routing: normalizeRouting(data.routing || {}),
    team: data.team,
    warning: data.warning,
  };
}

/**
 * Light wrapper that never throws — falls back to `null` so the caller can
 * keep using its local router result without disrupting the user flow.
 *
 * Returns the full route response so callers can read `team.activate` too.
 */
export async function safeFetchAutoPilotRouting(
  options: AutoPilotRouteOptions,
): Promise<{ routing: GlassRoutingResult; team?: AutoPilotTeamInfo } | null> {
  try {
    const result = await fetchAutoPilotRouting(options);
    return { routing: result.routing, team: result.team };
  } catch (err) {
    if ((err as Error)?.name !== 'AbortError') {
      console.warn('[autoPilotClient] route fallback:', (err as Error).message);
    }
    return null;
  }
}

export type AutoPilotGeneratePayload = AutoPilotRouteOptions & {
  context?: AutoPilotRouteContext & {
    messages?: Array<{ role: string; content: string }>;
    canvasContent?: string;
    projectContext?: Record<string, unknown>;
  };
};

export type AutoPilotGenerateResponse = {
  success: boolean;
  routing: GlassRoutingResult;
  response: {
    type: 'chat' | 'mixed';
    message: string;
    canvas: null | {
      shouldOpen: boolean;
      type: 'document' | 'web' | 'code' | 'presentation' | 'general';
      title: string;
      content: string;
      language?: string;
      format: 'markdown' | 'html' | 'code' | 'plain';
    };
    actions: string[];
    connectorNeeded?: boolean;
    missingConnector?: string | null;
  };
};

/**
 * POST /api/auto-pilot/generate
 * Returns the full Auto Pilot response (routing + AI generation).
 * Used for canvas-first paths (document/code/web) where backend runs the
 * composed system prompt end-to-end.
 */
export async function generateWithAutoPilot(
  payload: AutoPilotGeneratePayload,
): Promise<AutoPilotGenerateResponse> {
  const url = `${getApiUrl()}/api/auto-pilot/generate`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: payload.prompt,
      context: payload.context || {},
      manualOverride: payload.manualOverride,
    }),
    signal: payload.signal,
  });

  if (!res.ok) {
    throw new Error(`auto-pilot/generate failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    success: !!data.success,
    routing: normalizeRouting(data.routing || {}),
    response: data.response,
  };
}

export type SaveAutoPilotOutputInput = {
  userId: string;
  projectId?: string | null;
  title?: string;
  type?: 'chat' | 'document' | 'code' | 'web' | 'presentation' | 'general' | 'builder';
  content: string;
  routing?: GlassRoutingResult | null;
  sourcePrompt?: string;
};

export type SaveAutoPilotOutputResponse = {
  success: boolean;
  savedOutputId?: string | null;
  error?: string;
  message?: string;
};

/**
 * POST /api/auto-pilot/save-output
 * Persists a generated artifact (chat answer or canvas) to the user's Turso
 * `saved_outputs` table. If `projectId` is given, the output is also linked
 * as a project item.
 *
 * Returns `{ success: false, error: 'save_to_project_unavailable' }` when the
 * backend was not configured with a save handler (defensive — Turso is wired
 * in this build, but the endpoint never throws).
 */
export async function saveAutoPilotOutput(
  input: SaveAutoPilotOutputInput,
): Promise<SaveAutoPilotOutputResponse> {
  const url = `${getApiUrl()}/api/auto-pilot/save-output`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: input.userId,
      projectId: input.projectId ?? null,
      title: input.title || 'Auto Pilot output',
      type: input.type || 'chat',
      content: input.content,
      routing: input.routing || null,
      sourcePrompt: input.sourcePrompt || '',
    }),
  });

  // Backend is designed to return 200 even on save_to_project_unavailable;
  // we still parse JSON either way.
  const data = (await res.json().catch(() => ({}))) as SaveAutoPilotOutputResponse;
  return {
    success: !!data.success,
    savedOutputId: data.savedOutputId ?? null,
    error: data.error,
    message: data.message,
  };
}
