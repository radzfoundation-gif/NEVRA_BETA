import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app = null;
let dbInstance = null;
let initError = null;

const parseServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  // Allow either a JSON string OR a base64-encoded JSON string in env.
  // Vercel UI sometimes mangles newlines inside private_key, so base64 is the
  // robust path; we still accept plain JSON for local dev convenience.
  try {
    if (raw.startsWith('{')) return JSON.parse(raw);
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (err) {
    initError = `Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${err.message}`;
    return null;
  }
};

const getInitializedApp = () => {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }
  const sa = parseServiceAccount();
  try {
    if (sa) {
      app = initializeApp({
        credential: cert(sa),
        projectId: sa.project_id,
      });
      console.log('[Firebase Admin] Initialized with service account:', sa.project_id);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      app = initializeApp({ credential: applicationDefault() });
      console.log('[Firebase Admin] Initialized with GOOGLE_APPLICATION_CREDENTIALS');
    } else {
      initError = initError || 'FIREBASE_SERVICE_ACCOUNT_JSON not set';
      console.warn('[Firebase Admin] Not initialized:', initError);
      return null;
    }
  } catch (err) {
    initError = err.message;
    console.error('[Firebase Admin] Initialization failed:', err);
    return null;
  }
  return app;
};

export const db = new Proxy({}, {
  get(_target, prop) {
    if (!dbInstance) {
      const initialized = getInitializedApp();
      if (!initialized) {
        throw new Error(`Firebase Admin not initialized: ${initError || 'unknown'}`);
      }
      dbInstance = getFirestore(initialized);
    }
    return dbInstance[prop];
  },
});

export const isFirebaseReady = () => {
  if (app) return true;
  return !!getInitializedApp();
};

export const firebaseInitError = () => initError;
