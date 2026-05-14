/**
 * Auto Pilot — Response Formatter
 *
 * Produces the standardized response shape returned by /api/auto-pilot/generate.
 * Splits an AI completion into chat message + canvas artifact when needed,
 * and computes available actions based on the routing.
 */

const CANVAS_SEPARATOR = '---CANVAS---';

function inferLanguage(routing, content) {
  if (routing.canvasType !== 'code') return undefined;
  const fence = content.match(/```([a-zA-Z0-9_+-]+)/);
  if (fence) return fence[1];
  return 'text';
}

function stripFenceIfWhole(content) {
  const trimmed = content.trim();
  const m = trimmed.match(/^```[a-zA-Z0-9_+-]*\n([\s\S]*?)\n```$/);
  if (m) return m[1];
  return content;
}

function actionsFor(routing) {
  const base = ['copy', 'regenerate', 'continue', 'save_to_project'];
  if (!routing.canvasType) return base;

  const actions = [...base, 'open_in_canvas'];
  if (routing.outputFormat === 'pdf' || routing.canvasType === 'document') {
    actions.push('export_pdf');
  }
  return actions;
}

/**
 * Build the final response object.
 *
 * If the model returned `<chat>---CANVAS---<artifact>` we split it.
 * Otherwise: when canvasType is set, the whole completion is treated as the
 * canvas artifact and we synthesize a 1-line chat summary.
 */
export function formatGenerationResponse({ routing, completion }) {
  const safeCompletion = typeof completion === 'string' ? completion : String(completion ?? '');

  if (!routing.canvasType) {
    return {
      type: 'chat',
      message: safeCompletion.trim(),
      canvas: null,
      actions: actionsFor(routing),
    };
  }

  let chatPart = '';
  let canvasPart = safeCompletion;
  if (safeCompletion.includes(CANVAS_SEPARATOR)) {
    const idx = safeCompletion.indexOf(CANVAS_SEPARATOR);
    chatPart = safeCompletion.slice(0, idx).trim();
    canvasPart = safeCompletion.slice(idx + CANVAS_SEPARATOR.length).trim();
  } else {
    chatPart = `Auto Pilot prepared a ${routing.canvasType} for you in the canvas.`;
  }

  const cleanedCanvas = routing.canvasType === 'code'
    ? stripFenceIfWhole(canvasPart)
    : canvasPart;

  const format = routing.canvasType === 'web'
    ? 'html'
    : routing.canvasType === 'code'
      ? 'code'
      : 'markdown';

  return {
    type: 'mixed',
    message: chatPart,
    canvas: {
      shouldOpen: true,
      type: routing.canvasType,
      title: routing.canvasTitle || `Auto Pilot ${routing.canvasType}`,
      content: cleanedCanvas,
      language: inferLanguage(routing, canvasPart),
      format,
    },
    actions: actionsFor(routing),
  };
}

export function buildErrorResponse({ routing, error }) {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    success: false,
    error: 'Failed to generate response',
    message: 'UseGlass could not complete the request. Please retry or simplify your prompt.',
    debug: isProd ? undefined : (error && error.message ? error.message : String(error)),
    routing,
  };
}
