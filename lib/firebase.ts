import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, signInWithCustomToken, signOut, Auth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (missingKeys.length === 0) {
    try {
        app = getApps()[0] || initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
            connectFirestoreEmulator(db, 'localhost', 8080);
            connectAuthEmulator(auth, 'http://localhost:9099');
        }
    } catch (error) {
        console.error('[Firebase] init failed:', error);
    }
} else if (typeof window !== 'undefined') {
    console.warn('[Firebase] missing env keys:', missingKeys.join(', '));
}

export { app, db, auth };

/**
 * Bridge Clerk → Firebase Auth so Firestore Security Rules can use
 * `request.auth.uid === clerkUserId`.
 *
 * Flow:
 *   1. Caller obtains a Firebase custom token from Clerk:
 *        const token = await clerkAuth.getToken({ template: 'firebase' })
 *   2. Pass that token here. We sign the user into Firebase Auth, after which
 *      `auth.currentUser.uid` matches the Clerk userId encoded in the token.
 *
 * Returns true on success, false if Firebase isn't configured or sign-in fails.
 */
export async function bridgeClerkToFirebase(token: string | null | undefined): Promise<boolean> {
    if (!auth || !token) return false;
    try {
        await signInWithCustomToken(auth, token);
        return true;
    } catch (error) {
        console.error('[Firebase] bridgeClerkToFirebase failed:', error);
        return false;
    }
}

export async function signOutFirebase(): Promise<void> {
    if (!auth) return;
    try {
        await signOut(auth);
    } catch (error) {
        console.warn('[Firebase] signOut failed:', error);
    }
}

// ── Domain types (camelCase, native Firestore Timestamps surface as Date) ───
export interface FirebaseUser {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface FirebaseChatSession {
    id: string;
    userId: string;
    title: string;
    summary: string;
    glassMode: string | null;
    workflowMode: string | null;
    glassStyle: string | null;
    activeSkillId: string | null;
    activeConnectorId: string | null;
    canvasType: string | null;
    autoPilot: boolean;
    pinned: boolean;
    archived: boolean;
    isShared: boolean;
    shareId: string | null;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface FirebaseChatMessage {
    id: string;
    sessionId: string;
    userId: string;
    role: 'user' | 'ai';
    content: string;
    model: string | null;
    reasoning: boolean;
    tokens: number;
    attachments: any[];
    routing: Record<string, any>;
    metadata: Record<string, any>;
    parentId: string | null;
    createdAt: string;
}

export interface FirebaseUserPreferences {
    userId: string;
    autoPilot: boolean;
    defaultTool: string;
    defaultWorkflow: string;
    defaultStyle: string;
    defaultModel: string;
    uiTheme: string;
    sidebarState: string;
    metadata: Record<string, any>;
    updatedAt: string;
}

export default app;
