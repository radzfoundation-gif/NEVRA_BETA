import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate configuration
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

// Firebase is now OPTIONAL - Supabase is the primary database
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (missingKeys.length > 0) {
    console.warn('⚠️ Firebase not configured (using Supabase instead). Missing:', missingKeys.join(', '));
    console.log('💡 This is OK - Supabase is the primary database now.');
} else {
    try {
        // Initialize Firebase only if all credentials are present
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        // Connect to emulators in development (optional)
        if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
            connectFirestoreEmulator(db, 'localhost', 8080);
            connectAuthEmulator(auth, 'http://localhost:9099');
            console.log('🔥 Connected to Firebase Emulators');
        }
    } catch (error) {
        console.error('Firebase initialization failed:', error);
    }
}

// Export (may be null if not configured)
export { app, db, auth };

// Firestore TypeScript interfaces
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
    mode: 'builder' | 'tutor';
    provider: 'anthropic' | 'openai' | 'gemini' | 'groq';
    createdAt: Date;
    updatedAt: Date;
}

export interface FirebaseMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    code: string | null;
    images: string[] | null;
    createdAt: Date;
}

export interface FirebaseAIUsage {
    id: string;
    userId: string;
    sessionId: string | null;
    provider: string;
    model: string | null;
    tokensUsed: number;
    costUsd: number;
    createdAt: Date;
}

export interface FirebaseUserPreferences {
    userId: string;
    defaultProvider: 'groq' | 'gemini' | 'openai';
    theme: string;
    preferences: Record<string, any>;
    tokenLimit?: number;
    tokensUsed?: number;
    tier?: 'free' | 'pro' | 'enterprise';
    plan?: string;
    updatedAt: Date;
}

export default app;
