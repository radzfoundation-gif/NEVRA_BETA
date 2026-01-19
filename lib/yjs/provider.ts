/**
 * YJS Provider for Frontend
 * Connects Excalidraw canvas to YJS WebSocket server
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { createClient } from '@/lib/supabase';

export interface YJSConnection {
    doc: Y.Doc;
    provider: WebsocketProvider;
    awareness: any;
    destroy: () => void;
}

/**
 * Create YJS connection for a canvas room
 * @param roomId - Room ID (format: nevra-{canvasId})
 * @param onSynced - Callback when initial sync is complete
 * @param onStatusChange - Callback for connection status changes
 */
export async function createYJSConnection(
    roomId: string,
    onSynced?: () => void,
    onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void
): Promise<YJSConnection | null> {
    try {
        // Get auth token from Supabase
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            console.error('[YJS] Not authenticated');
            return null;
        }

        const token = session.access_token;
        const yjsServerUrl = process.env.NEXT_PUBLIC_YJS_SERVER_URL || 'ws://localhost:1234';

        // Ensure roomId has correct format
        if (!roomId.startsWith('nevra-')) {
            roomId = `nevra-${roomId}`;
        }

        // Create Y.Doc
        const doc = new Y.Doc();

        // Create WebSocket provider
        const provider = new WebsocketProvider(
            yjsServerUrl,
            roomId,
            doc,
            {
                params: { token }, // JWT token for authentication
                connect: true,
                awareness: {
                    // Share user presence info
                    name: session.user.email || 'Anonymous',
                    color: generateUserColor(session.user.id),
                },
            }
        );

        // Connection status listeners
        provider.on('status', (event: { status: string }) => {
            console.log(`[YJS] Connection status: ${event.status}`);
            onStatusChange?.(event.status as any);
        });

        provider.on('sync', (isSynced: boolean) => {
            if (isSynced) {
                console.log(`[YJS] Synced with room: ${roomId}`);
                onSynced?.();
            }
        });

        provider.on('connection-close', (event: any) => {
            console.warn('[YJS] Connection closed:', event.code, event.reason);
        });

        provider.on('connection-error', (event: any) => {
            console.error('[YJS] Connection error:', event.error);
        });

        // Destroy function to clean up
        const destroy = () => {
            provider.disconnect();
            provider.destroy();
            doc.destroy();
            console.log(`[YJS] Disconnected from room: ${roomId}`);
        };

        return {
            doc,
            provider,
            awareness: provider.awareness,
            destroy,
        };
    } catch (error) {
        console.error('[YJS] Failed to create connection:', error);
        return null;
    }
}

/**
 * Generate consistent color for user based on ID
 */
function generateUserColor(userId: string): string {
    const colors = [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#45B7D1', // Blue
        '#FFA07A', // Orange
        '#98D8C8', // Mint
        '#F7DC6F', // Yellow
        '#BB8FCE', // Purple
        '#85C1E2', // Sky Blue
    ];

    // Simple hash function to get consistent index
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

/**
 * Get list of active users in room
 */
export function getActiveUsers(connection: YJSConnection): Array<{
    id: string;
    name: string;
    color: string;
}> {
    const users: Array<{ id: string; name: string; color: string }> = [];

    connection.awareness.getStates().forEach((state: any, clientId: number) => {
        if (state.name) {
            users.push({
                id: clientId.toString(),
                name: state.name,
                color: state.color || '#000000',
            });
        }
    });

    return users;
}
