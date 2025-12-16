import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    onSnapshot,
    Unsubscribe,
    QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import type {
    FirebaseUser,
    FirebaseChatSession,
    FirebaseMessage,
    FirebaseAIUsage,
    FirebaseUserPreferences
} from './firebase';

// Re-export types for convenience
export type {
    FirebaseUser,
    FirebaseChatSession,
    FirebaseMessage,
    FirebaseAIUsage,
    FirebaseUserPreferences
};

// =====================================================
// USER FUNCTIONS
// =====================================================

/**
 * Sync user from Clerk to Firestore
 */
export async function syncUser(clerkUser: any): Promise<FirebaseUser | null> {
    try {
        const userRef = doc(db, 'users', clerkUser.id);
        const userData: FirebaseUser = {
            id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            fullName: clerkUser.fullName,
            avatarUrl: clerkUser.imageUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await setDoc(userRef, userData, { merge: true });
        return userData;
    } catch (error) {
        console.error('Error syncing user:', error);
        return null;
    }
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<FirebaseUser | null> {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data() as FirebaseUser;
        }
        return null;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

// =====================================================
// CHAT SESSION FUNCTIONS
// =====================================================

/**
 * Create a new chat session
 */
export async function createChatSession(
    userId: string,
    mode: 'builder' | 'tutor',
    provider: string,
    title: string
): Promise<FirebaseChatSession | null> {
    try {
        const sessionData = {
            userId,
            title,
            mode,
            provider,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const sessionRef = await addDoc(collection(db, 'chatSessions'), sessionData);

        return {
            id: sessionRef.id,
            ...sessionData
        } as FirebaseChatSession;
    } catch (error) {
        console.error('Error creating chat session:', error);
        return null;
    }
}

/**
 * Get all chat sessions for a user
 */
export async function getUserSessions(userId: string): Promise<FirebaseChatSession[]> {
    try {
        const q = query(
            collection(db, 'chatSessions'),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FirebaseChatSession[];
    } catch (error) {
        console.error('Error getting user sessions:', error);
        return [];
    }
}

/**
 * Get a single chat session
 */
export async function getChatSession(sessionId: string): Promise<FirebaseChatSession | null> {
    try {
        const sessionRef = doc(db, 'chatSessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (sessionSnap.exists()) {
            return {
                id: sessionSnap.id,
                ...sessionSnap.data()
            } as FirebaseChatSession;
        }
        return null;
    } catch (error) {
        console.error('Error getting chat session:', error);
        return null;
    }
}

/**
 * Update chat session
 */
export async function updateChatSession(
    sessionId: string,
    updates: Partial<FirebaseChatSession>
): Promise<boolean> {
    try {
        const sessionRef = doc(db, 'chatSessions', sessionId);
        await updateDoc(sessionRef, {
            ...updates,
            updatedAt: new Date()
        });
        return true;
    } catch (error) {
        console.error('Error updating chat session:', error);
        return false;
    }
}

/**
 * Delete chat session and all its messages
 */
export async function deleteChatSession(sessionId: string): Promise<boolean> {
    try {
        // Delete all messages first
        const messagesRef = collection(db, 'chatSessions', sessionId, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);

        const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Delete session
        const sessionRef = doc(db, 'chatSessions', sessionId);
        await deleteDoc(sessionRef);

        return true;
    } catch (error) {
        console.error('Error deleting chat session:', error);
        return false;
    }
}

/**
 * Subscribe to user sessions (real-time)
 */
export function subscribeToUserSessions(
    userId: string,
    callback: (sessions: FirebaseChatSession[]) => void
): Unsubscribe {
    const q = query(
        collection(db, 'chatSessions'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const sessions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FirebaseChatSession[];
        callback(sessions);
    });
}

// =====================================================
// MESSAGE FUNCTIONS
// =====================================================

/**
 * Save a message to a chat session
 */
export async function saveMessage(
    sessionId: string,
    role: 'user' | 'ai',
    content: string,
    code?: string,
    images?: string[]
): Promise<FirebaseMessage | null> {
    try {
        const messageData = {
            role,
            content,
            code: code || null,
            images: images || null,
            createdAt: new Date(),
        };

        const messageRef = await addDoc(
            collection(db, 'chatSessions', sessionId, 'messages'),
            messageData
        );

        // Update session's updatedAt
        await updateChatSession(sessionId, {});

        return {
            id: messageRef.id,
            ...messageData
        } as FirebaseMessage;
    } catch (error) {
        console.error('Error saving message:', error);
        return null;
    }
}

/**
 * Get messages for a chat session
 */
export async function getSessionMessages(sessionId: string): Promise<FirebaseMessage[]> {
    try {
        const q = query(
            collection(db, 'chatSessions', sessionId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FirebaseMessage[];
    } catch (error) {
        console.error('Error getting session messages:', error);
        return [];
    }
}

/**
 * Subscribe to session messages (real-time)
 */
export function subscribeToSessionMessages(
    sessionId: string,
    callback: (messages: FirebaseMessage[]) => void
): Unsubscribe {
    const q = query(
        collection(db, 'chatSessions', sessionId, 'messages'),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FirebaseMessage[];
        callback(messages);
    });
}

// =====================================================
// AI USAGE TRACKING
// =====================================================

/**
 * Track AI usage
 */
export async function trackAIUsage(
    userId: string,
    sessionId: string | null,
    provider: string,
    model: string | null,
    tokensUsed: number,
    costUsd: number
): Promise<boolean> {
    try {
        const usageData = {
            userId,
            sessionId,
            provider,
            model,
            tokensUsed,
            costUsd,
            createdAt: new Date(),
        };

        await addDoc(collection(db, 'aiUsage'), usageData);
        return true;
    } catch (error) {
        console.error('Error tracking AI usage:', error);
        return false;
    }
}

/**
 * Get AI usage for a user
 */
export async function getUserAIUsage(userId: string, limitCount: number = 100): Promise<FirebaseAIUsage[]> {
    try {
        const q = query(
            collection(db, 'aiUsage'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FirebaseAIUsage[];
    } catch (error) {
        console.error('Error getting AI usage:', error);
        return [];
    }
}

// =====================================================
// USER PREFERENCES
// =====================================================

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<FirebaseUserPreferences | null> {
    try {
        const prefRef = doc(db, 'userPreferences', userId);
        const prefSnap = await getDoc(prefRef);

        if (prefSnap.exists()) {
            return prefSnap.data() as FirebaseUserPreferences;
        }
        return null;
    } catch (error) {
        console.error('Error getting user preferences:', error);
        return null;
    }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
    userId: string,
    preferences: Partial<FirebaseUserPreferences>
): Promise<boolean> {
    try {
        const prefRef = doc(db, 'userPreferences', userId);
        await setDoc(prefRef, {
            userId,
            ...preferences,
            updatedAt: new Date()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating user preferences:', error);
        return false;
    }
}

// =====================================================
// USER MEMORY FUNCTIONS
// =====================================================

/**
 * Save user memory entry
 */
export async function saveUserMemory(
    userId: string,
    memoryEntry: any
): Promise<boolean> {
    try {
        await addDoc(collection(db, 'users', userId, 'memories'), {
            ...memoryEntry,
            timestamp: new Date()
        });
        return true;
    } catch (error) {
        console.error('Error saving user memory:', error);
        return false;
    }
}

/**
 * Get user memories
 */
export async function getUserMemories(
    userId: string,
    limitCount: number = 50
): Promise<any[]> {
    try {
        const q = query(
            collection(db, 'users', userId, 'memories'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting user memories:', error);
        return [];
    }
}
