/**
 * Auto Pilot — Canvas Type Detection
 *
 * Maps the prompt + intent rule to the right canvas surface.
 * canvasType is one of: document | web | code | presentation | general | null
 */

const DOCUMENT_HINTS = [
  'pdf', 'proposal', 'prd', 'laporan', 'makalah', 'essay', 'esai',
  'artikel panjang', 'long article', 'surat', 'strategy document',
  'roadmap', 'whitepaper', 'dokumen', 'document', 'business plan',
  'rencana bisnis',
];

const WEB_HINTS = [
  'website', 'landing page', 'dashboard', ' ui ', 'app layout',
  'pricing page', 'login page', 'signup page', 'web app', 'halaman web',
  'glassmorphism', 'tailwind', 'react component', 'next.js page',
];

const CODE_HINTS = [
  'refactor', 'debug', 'stack trace', 'config file', 'env file',
  'function', 'fungsi', 'script', 'class ', 'module', 'algoritma',
  'algorithm', 'unit test', 'kode panjang', 'long code',
];

const PRESENTATION_HINTS = [
  'presentation', 'pitch deck', 'slide', 'deck', 'pptx', 'keynote',
  'slide outline', 'pitch presentation',
];

const PDF_HINTS = ['pdf', 'export pdf', 'generate pdf', 'buatkan pdf', 'buat pdf'];

function any(promptLower, hints) {
  return hints.some((h) => promptLower.includes(h));
}

/**
 * Decide canvasType + outputFormat hints based on the prompt.
 * `intentHint` from rules.js can force a base canvas type (e.g. 'web', 'code').
 */
export function detectCanvas({ promptLower, intentHint = null }) {
  let canvasType = null;
  let wantsPdf = any(promptLower, PDF_HINTS);

  if (intentHint === 'web') canvasType = 'web';
  else if (intentHint === 'code') canvasType = 'code';
  else if (intentHint === 'document') canvasType = 'document';
  else if (intentHint === 'presentation') canvasType = 'presentation';

  if (!canvasType) {
    if (any(promptLower, WEB_HINTS)) canvasType = 'web';
    else if (any(promptLower, PRESENTATION_HINTS)) canvasType = 'presentation';
    else if (any(promptLower, DOCUMENT_HINTS)) canvasType = 'document';
    else if (any(promptLower, CODE_HINTS)) canvasType = 'code';
  }

  if (wantsPdf && !canvasType) canvasType = 'document';

  return { canvasType, wantsPdf };
}
