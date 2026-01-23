import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

/**
 * MCP Client for Noir AI
 * Connects to MCP server and provides resource access API
 */
class MCPClient {
    private client: Client | null;
    private transport: StdioClientTransport | null;
    private connected: boolean;

    constructor() {
        this.client = null;
        this.transport = null;
        this.connected = false;
    }

    /**
     * Connect to MCP server
     */
    async connect() {
        if (this.connected) {
            return;
        }

        // Skip MCP connection in browser environment
        if (typeof window !== 'undefined') {
            console.warn('⚠️ MCP Client: Skipping connection in browser environment');
            return;
        }

        try {
            // Get working directory - use import.meta.url for ES modules or fallback
            let cwd: string;
            try {
                if (typeof process !== 'undefined' && process.cwd) {
                    cwd = process.cwd();
                } else {
                    // Fallback: use current directory from import.meta.url
                    const url = new URL(import.meta.url);
                    cwd = url.pathname.split('/').slice(0, -3).join('/') || '.';
                }
            } catch {
                cwd = '.';
            }

            // Create transport using correct SDK API
            this.transport = new StdioClientTransport({
                command: 'node',
                args: ['mcp-server/index.js'],
                cwd: cwd,
            });

            // Create client
            this.client = new Client(
                {
                    name: 'noir-ai-client',
                    version: '1.0.0',
                },
                {
                    capabilities: {},
                }
            );

            // Connect
            await this.client.connect(this.transport);
            this.connected = true;

            console.log('✅ MCP Client connected to server');
        } catch (error) {
            console.error('❌ Failed to connect to MCP server:', error);
            throw error;
        }
    }

    /**
     * Read a resource from MCP server
     */
    async readResource(uri: string): Promise<any> {
        if (!this.connected) {
            await this.connect();
        }

        if (!this.client) {
            throw new Error('MCP client not connected');
        }

        try {
            if (!this.client) {
                throw new Error('MCP client not initialized');
            }
            // @ts-ignore - MCP SDK type issue
            const response = await this.client.request(
                { method: 'resources/read', params: { uri } }
            );

            // Parse the response
            if (response.contents && response.contents.length > 0) {
                const content = response.contents[0];
                if (content.mimeType === 'application/json') {
                    return JSON.parse(content.text);
                }
                return content.text;
            }

            return null;
        } catch (error) {
            console.error(`Error reading resource ${uri}:`, error);
            throw error;
        }
    }

    /**
     * Call a tool on MCP server
     */
    async callTool(name: string, args: any): Promise<any> {
        if (!this.connected) {
            await this.connect();
        }

        if (!this.client) {
            throw new Error('MCP client not connected');
        }

        try {
            if (!this.client) {
                throw new Error('MCP client not initialized');
            }
            // @ts-ignore - MCP SDK type issue
            const response = await this.client.request(
                {
                    method: 'tools/call',
                    params: {
                        name,
                        arguments: args,
                    },
                }
            );

            if (response.content && response.content.length > 0) {
                const content = response.content[0];
                if (content.type === 'text') {
                    return JSON.parse(content.text);
                }
                return content.text;
            }

            return null;
        } catch (error) {
            console.error(`Error calling tool ${name}:`, error);
            throw error;
        }
    }

    /**
     * Get user memories via MCP
     */
    async getUserMemories(userId: string, limit = 50): Promise<any> {
        return this.readResource(`firebase://user/${userId}/memories?limit=${limit}`);
    }

    /**
     * Get user profile via MCP
     */
    async getUserProfile(userId: string): Promise<any> {
        return this.readResource(`firebase://user/${userId}/profile`);
    }

    /**
     * Get chat sessions via MCP
     */
    async getChatSessions(userId: string, limit = 50): Promise<any> {
        return this.readResource(`firebase://user/${userId}/sessions?limit=${limit}`);
    }

    /**
     * Get user preferences via MCP
     */
    async getUserPreferences(userId: string): Promise<any> {
        return this.readResource(`firebase://user/${userId}/preferences`);
    }

    /**
     * Save user memory via MCP tool
     */
    async saveUserMemory(userId: string, memoryEntry: any): Promise<any> {
        return this.callTool('save_user_memory', { userId, memoryEntry });
    }

    /**
     * Disconnect from MCP server
     */
    async disconnect() {
        if (this.client && this.connected) {
            await this.client.close();
            this.connected = false;
            console.log('MCP Client disconnected');
        }
    }
}

// Singleton instance
let mcpClientInstance = null;

/**
 * Get MCP client singleton
 */
export function getMCPClient() {
    if (!mcpClientInstance) {
        mcpClientInstance = new MCPClient();
    }
    return mcpClientInstance;
}

export default MCPClient;
