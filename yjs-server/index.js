/**
 * NEVRA YJS WebSocket Server
 * Provides realtime collaboration for Excalidraw canvases
 * 
 * Features:
 * - Room-based architecture (nevra-{canvasId})
 * - JWT authentication via Supabase
 * - Auto cleanup of inactive rooms
 * - Health check endpoint
 * - Graceful shutdown
 */

import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils.js';
import http from 'http';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 1234;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!JWT_SECRET) {
    console.error('❌ SUPABASE_JWT_SECRET environment variable is required');
    process.exit(1);
}

// In-memory document storage
// For production: Consider using Redis or a distributed cache
const docs = new Map();

// Track document activity for cleanup
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const INACTIVE_TIMEOUT = 60 * 60 * 1000; // 1 hour

/**
 * Cleanup inactive documents
 */
function cleanupInactiveDocs() {
    const now = Date.now();
    let cleaned = 0;

    docs.forEach((doc, roomId) => {
        // Only cleanup if no active connections and inactive for > 1 hour
        if (doc.conns.size === 0 && now - doc.lastActivity > INACTIVE_TIMEOUT) {
            docs.delete(roomId);
            cleaned++;
            console.log(`🗑️ Cleaned up inactive room: ${roomId}`);
        }
    });

    if (cleaned > 0) {
        console.log(`✅ Cleanup complete: Removed ${cleaned} inactive rooms`);
    }
}

// Schedule periodic cleanup
const cleanupTimer = setInterval(cleanupInactiveDocs, CLEANUP_INTERVAL);

/**
 * Verify JWT token from Supabase
 */
function verifyToken(token) {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return {
            valid: true,
            userId: payload.sub,
            email: payload.email,
        };
    } catch (err) {
        console.error('❌ JWT verification failed:', err.message);
        return { valid: false };
    }
}

/**
 * Validate room ID format
 */
function isValidRoomId(roomId) {
    // Format: nevra-{uuid} or nevra-{alphanumeric}
    return /^nevra-[a-zA-Z0-9_-]+$/.test(roomId);
}

// HTTP server for health checks
const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/health') {
        const health = {
            status: 'ok',
            uptime: process.uptime(),
            activeRooms: docs.size,
            totalConnections: Array.from(docs.values()).reduce(
                (total, doc) => total + doc.conns.size,
                0
            ),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health, null, 2));
    } else if (req.url === '/rooms') {
        // List active rooms (for debugging in development)
        if (NODE_ENV !== 'production') {
            const roomsList = Array.from(docs.entries()).map(([roomId, doc]) => ({
                roomId,
                connections: doc.conns.size,
                lastActivity: new Date(doc.lastActivity).toISOString(),
            }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(roomsList, null, 2));
        } else {
            res.writeHead(403);
            res.end('Forbidden');
        }
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (conn, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomId = url.searchParams.get('room');
    const token = url.searchParams.get('token');

    // Validate room ID format
    if (!roomId || !isValidRoomId(roomId)) {
        console.warn(`⚠️ Invalid room ID: ${roomId}`);
        conn.close(1008, 'Invalid room ID format. Must be: nevra-{id}');
        return;
    }

    // Authenticate user via JWT
    const auth = verifyToken(token);
    if (!auth.valid) {
        console.warn(`⚠️ Authentication failed for room: ${roomId}`);
        conn.close(1008, 'Authentication failed');
        return;
    }

    conn.userId = auth.userId;
    conn.userEmail = auth.email;
    conn.roomId = roomId;

    console.log(`✅ User ${auth.email} (${auth.userId.substring(0, 8)}...) joined room: ${roomId}`);

    // Get or create Y.Doc for this room
    let doc = docs.get(roomId);
    if (!doc) {
        doc = {
            ydoc: new Y.Doc(),
            conns: new Set(),
            lastActivity: Date.now(),
            createdAt: Date.now(),
        };
        docs.set(roomId, doc);
        console.log(`📄 Created new room: ${roomId}`);
    }

    doc.conns.add(conn);
    doc.lastActivity = Date.now();

    // Setup YJS WebSocket connection
    try {
        setupWSConnection(conn, req, {
            docName: roomId,
            doc: doc.ydoc,
            gc: true, // Enable garbage collection
        });
    } catch (error) {
        console.error('❌ Error setting up YJS connection:', error);
        conn.close(1011, 'Internal server error');
        return;
    }

    // Handle connection close
    conn.on('close', () => {
        doc.conns.delete(conn);
        doc.lastActivity = Date.now();

        console.log(
            `👋 User ${auth.email} left room ${roomId} (${doc.conns.size} remaining)`
        );

        // Immediate cleanup if room is empty
        if (doc.conns.size === 0) {
            console.log(`📭 Room ${roomId} is now empty`);
        }
    });

    // Handle errors
    conn.on('error', (error) => {
        console.error(`❌ WebSocket error in room ${roomId}:`, error.message);
    });
});

// Graceful shutdown
function shutdown() {
    console.log('\n🛑 Shutting down YJS server...');

    clearInterval(cleanupTimer);

    wss.clients.forEach((client) => {
        client.close(1001, 'Server shutting down');
    });

    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
        console.error('⏰ Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
server.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 NEVRA YJS Collaboration Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📡 WebSocket: ws://localhost:${PORT}?room=nevra-{id}&token={jwt}`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
