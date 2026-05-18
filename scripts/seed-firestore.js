#!/usr/bin/env node
/**
 * One-shot seeder for Firestore catalog/* collections.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='{...}' node scripts/seed-firestore.js
 *
 * Idempotent — re-running merges existing docs.
 */

import { config as loadEnv } from 'dotenv';
import { ensureCatalogSeeded } from '../server/firestore.js';
import { isFirebaseReady, firebaseInitError } from '../server/firebase-admin.js';

loadEnv();
loadEnv({ path: '.env.local' });

(async () => {
  if (!isFirebaseReady()) {
    console.error('[seed] Firebase Admin not initialized:', firebaseInitError());
    console.error('Set FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON or base64-encoded) before running.');
    process.exit(1);
  }
  console.log('[seed] Starting catalog seed...');
  try {
    await ensureCatalogSeeded();
    console.log('[seed] Done. Catalog collections seeded:');
    console.log('  catalog/glassTools/items     (5 docs)');
    console.log('  catalog/workflowModes/items  (8 docs)');
    console.log('  catalog/skills/items         (10 docs)');
    console.log('  catalog/styles/items         (13 docs)');
    console.log('  catalog/connectors/items     (9 docs)');
    process.exit(0);
  } catch (err) {
    console.error('[seed] FAILED:', err);
    process.exit(2);
  }
})();
