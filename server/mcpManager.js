import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'server', 'mcp_servers.json');

class McpManager {
    constructor() {
        this.clients = new Map();
        this.servers = [];
        this.loadServers();
    }

    loadServers() {
        try {
            if (fs.existsSync(CONFIG_PATH)) {
                this.servers = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
                this.initializeClients();
            }
        } catch (error) {
            console.error('[MCP] Failed to load servers config:', error);
        }
    }

    saveServers() {
        try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.servers, null, 2));
        } catch (error) {
            console.error('[MCP] Failed to save servers config:', error);
        }
    }

    async initializeClients() {
        for (const server of this.servers) {
            if (server.enabled) {
                await this.connectToServer(server);
            }
        }
    }

    async connectToServer(server) {
        try {
            console.log(`[MCP] Connecting to ${server.name} at ${server.url}...`);
            const transport = new StreamableHTTPClientTransport(new URL(server.url));
            const client = new Client({
                name: 'Noir-AI-Client',
                version: '1.0.0'
            });

            await client.connect(transport);
            this.clients.set(server.id, { client, name: server.name });
            console.log(`[MCP] Connected to ${server.name}`);
            return true;
        } catch (error) {
            console.error(`[MCP] Failed to connect to ${server.name}:`, error.message);
            return false;
        }
    }

    async addServer(name, url) {
        const id = Date.now().toString();
        const server = { id, name, url, enabled: true };
        this.servers.push(server);
        this.saveServers();
        const connected = await this.connectToServer(server);
        return { connected, server };
    }

    async removeServer(id) {
        const clientInfo = this.clients.get(id);
        if (clientInfo) {
            try {
                await clientInfo.client.close();
            } catch (e) { }
            this.clients.delete(id);
        }
        this.servers = this.servers.filter(s => s.id !== id);
        this.saveServers();
    }

    async listAllTools() {
        const allTools = [];
        for (const [id, info] of this.clients.entries()) {
            try {
                const toolsResult = await info.client.listTools();
                const tools = toolsResult.tools.map(tool => ({
                    ...tool,
                    serverId: id,
                    serverName: info.name
                }));
                allTools.push(...tools);
            } catch (error) {
                console.error(`[MCP] Failed to list tools for ${info.name}:`, error.message);
            }
        }
        return allTools;
    }

    async executeTool(serverId, toolName, args) {
        const info = this.clients.get(serverId);
        if (!info) throw new Error(`Server ${serverId} not found or not connected`);

        try {
            return await info.client.callTool({
                name: toolName,
                arguments: args
            });
        } catch (error) {
            console.error(`[MCP] Error executing tool ${toolName} on ${info.name}:`, error.message);
            throw error;
        }
    }

    getServers() {
        return this.servers.map(s => ({
            ...s,
            connected: this.clients.has(s.id)
        }));
    }
}

export const mcpManager = new McpManager();
