import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

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

if (missingKeys.length > 0) {
    const isProduction = import.meta.env.PROD;
    const errorMessage = isProduction
        ? `Missing Firebase credentials: ${missingKeys.join(', ')}. Please add them to your Vercel environment variables.`
        : `Missing Firebase credentials: ${missingKeys.join(', ')}. Please add them to your .env.local file`;
    throw new Error(errorMessage);
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth (for future use, currently using Clerk)
export const auth = getAuth(app);

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('🔥 Connected to Firebase Emulators');
}

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
    provider: 'anthropic' | 'deepseek' | 'openai' | 'gemini';
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
    updatedAt: Date;
}

export default app;
