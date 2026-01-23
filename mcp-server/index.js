#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { FirebaseResource } from './resources/firebase.js';

// MCP Server for Noir AI
const server = new Server(
    {
        name: 'noir-ai-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    }
);

// Initialize Firebase resource
const firebaseResource = new FirebaseResource();

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'firebase://user/{userId}/memories',
                name: 'User Memories',
                description: 'Get user memory entries from Firebase',
                mimeType: 'application/json',
            },
            {
                uri: 'firebase://user/{userId}/profile',
                name: 'User Profile',
                description: 'Get user profile information',
                mimeType: 'application/json',
            },
            {
                uri: 'firebase://user/{userId}/sessions',
                name: 'Chat Sessions',
                description: 'Get user chat sessions',
                mimeType: 'application/json',
            },
            {
                uri: 'firebase://user/{userId}/preferences',
                name: 'User Preferences',
                description: 'Get user preferences',
                mimeType: 'application/json',
            },
        ],
    };
});

// Read resource handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    // Parse URI
    const match = uri.match(/^firebase:\/\/user\/([^\/]+)\/(.+)$/);
    if (!match) {
        throw new Error(`Invalid resource URI: ${uri}`);
    }

    const [, userId, resourceType] = match;

    // Handle different resource types
    switch (resourceType) {
        case 'memories':
            return await firebaseResource.getUserMemories(userId);
        case 'profile':
            return await firebaseResource.getUserProfile(userId);
        case 'sessions':
            return await firebaseResource.getChatSessions(userId);
        case 'preferences':
            return await firebaseResource.getUserPreferences(userId);
        default:
            throw new Error(`Unknown resource type: ${resourceType}`);
    }
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'save_user_memory',
                description: 'Save a memory entry for a user',
                inputSchema: {
                    type: 'object',
                    properties: {
                        userId: {
                            type: 'string',
                            description: 'User ID',
                        },
                        memoryEntry: {
                            type: 'object',
                            description: 'Memory entry to save',
                        },
                    },
                    required: ['userId', 'memoryEntry'],
                },
            },
        ],
    };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case 'save_user_memory':
            return await firebaseResource.saveUserMemory(args.userId, args.memoryEntry);
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Noir AI MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
