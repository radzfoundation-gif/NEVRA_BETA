/**
 * Auto Pilot — Connector Selection
 *
 * Connectors are gated by both prompt relevance AND availability.
 * "Coming soon" connectors must never be selected.
 */

const COMING_SOON = new Set([
  'Google Drive', 'Gmail', 'Calendar', 'Notion', 'Slack', 'Discord', 'Firestore',
]);

const CONNECTOR_HINTS = {
  'Web Search': [
    'cari', 'search', 'google', 'browsing', 'browse the web',
    'sumber online', 'real-time', 'realtime', 'terkini', 'terbaru', 'latest',
    'news', 'berita', 'harga sekarang', 'current price',
  ],
  'GitHub': [
    'github', 'repo', 'repository', 'pull request', 'pr ', 'branch',
    'commit', 'merge', 'fork', 'gh cli',
  ],
  'Local Documents': [
    'dokumen lokal', 'file saya', 'pdf saya', 'attached file', 'lampiran',
    'uploaded document', 'berdasarkan dokumen',
  ],
};

function normalizeConnectors(availableConnectors) {
  const map = new Map();
  if (!Array.isArray(availableConnectors)) return map;

  for (const entry of availableConnectors) {
    if (!entry) continue;
    if (typeof entry === 'string') {
      map.set(entry, { name: entry, connected: true });
      continue;
    }
    if (typeof entry === 'object' && entry.name) {
      const connected = entry.connected !== false && entry.status !== 'coming_soon';
      map.set(entry.name, { name: entry.name, connected });
    }
  }
  return map;
}

/**
 * Decide which connector (if any) Auto Pilot should use.
 *
 * Returns { selected, needed, missing }
 *  - selected: connector name to actually use, or null
 *  - needed: which connector the prompt clearly wants
 *  - missing: connector the prompt wants but is not connected (or null)
 */
export function selectConnector({
  promptLower,
  availableConnectors,
  hint, // optional override hint from rules ('Web Search' | 'GitHub' | 'Local Documents')
  hasUploadedDocument = false,
}) {
  const map = normalizeConnectors(availableConnectors);

  const candidates = [];
  if (hint) candidates.push(hint);

  for (const [name, hints] of Object.entries(CONNECTOR_HINTS)) {
    if (candidates.includes(name)) continue;
    if (hints.some((h) => promptLower.includes(h))) candidates.push(name);
  }

  let needed = null;
  for (const name of candidates) {
    if (COMING_SOON.has(name)) continue;
    needed = name;
    break;
  }

  if (!needed) return { selected: null, needed: null, missing: null };

  if (needed === 'Local Documents' && hasUploadedDocument) {
    return { selected: 'Local Documents', needed, missing: null };
  }

  const entry = map.get(needed);
  if (entry && entry.connected) {
    return { selected: needed, needed, missing: null };
  }

  return { selected: null, needed, missing: needed };
}

export function isComingSoon(name) {
  return COMING_SOON.has(name);
}
