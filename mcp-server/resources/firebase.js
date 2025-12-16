import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Firebase Resource for MCP Server
 * Provides access to Firebase/Firestore data
 */
export class FirebaseResource {
    constructor() {
        // Initialize Firebase Admin if not already initialized
        if (!admin.apps.length) {
            try {
                // Try to load service account from environment or file
                const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
                    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
                    : null;

                if (serviceAccount) {
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });
                } else {
                    // Use application default credentials
                    admin.initializeApp();
                }

                console.error('Firebase Admin initialized for MCP server');
            } catch (error) {
                console.error('Failed to initialize Firebase Admin:', error);
                throw error;
            }
        }

        this.db = admin.firestore();
    }

    /**
     * Get user memories
     */
    async getUserMemories(userId, limit = 50) {
        try {
            const snapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('memories')
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const memories = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
            }));

            return {
                contents: [
                    {
                        uri: `firebase://user/${userId}/memories`,
                        mimeType: 'application/json',
                        text: JSON.stringify(memories, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('Error getting user memories:', error);
            throw error;
        }
    }

    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();

            if (!userDoc.exists) {
                return {
                    contents: [
                        {
                            uri: `firebase://user/${userId}/profile`,
                            mimeType: 'application/json',
                            text: JSON.stringify({ error: 'User not found' }),
                        },
                    ],
                };
            }

            const userData = userDoc.data();

            return {
                contents: [
                    {
                        uri: `firebase://user/${userId}/profile`,
                        mimeType: 'application/json',
                        text: JSON.stringify(userData, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }

    /**
     * Get chat sessions
     */
    async getChatSessions(userId, limit = 50) {
        try {
            const snapshot = await this.db
                .collection('chatSessions')
                .where('userId', '==', userId)
                .orderBy('updatedAt', 'desc')
                .limit(limit)
                .get();

            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
            }));

            return {
                contents: [
                    {
                        uri: `firebase://user/${userId}/sessions`,
                        mimeType: 'application/json',
                        text: JSON.stringify(sessions, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('Error getting chat sessions:', error);
            throw error;
        }
    }

    /**
     * Get user preferences
     */
    async getUserPreferences(userId) {
        try {
            const prefDoc = await this.db.collection('userPreferences').doc(userId).get();

            const preferences = prefDoc.exists ? prefDoc.data() : null;

            return {
                contents: [
                    {
                        uri: `firebase://user/${userId}/preferences`,
                        mimeType: 'application/json',
                        text: JSON.stringify(preferences, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('Error getting user preferences:', error);
            throw error;
        }
    }

    /**
     * Save user memory (Tool)
     */
    async saveUserMemory(userId, memoryEntry) {
        try {
            const docRef = await this.db
                .collection('users')
                .doc(userId)
                .collection('memories')
                .add({
                    ...memoryEntry,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            id: docRef.id,
                        }),
                    },
                ],
            };
        } catch (error) {
            console.error('Error saving user memory:', error);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message,
                        }),
                    },
                ],
            };
        }
    }
}
