import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'server', 'mcp_servers.json');

class McpManager {
    constructor() {
        this.clients = new Map();
        this.servers = [];
        this.loadServers();
        this.setupWatcher();
    }

    setupWatcher() {
        try {
            // Hot-reload when config changes (e.g. from CLI or UI)
            fs.watch(CONFIG_PATH, (eventType) => {
                if (eventType === 'change') {
                    console.log('[MCP] Config changed, reloading servers...');
                    this.loadServers();
                }
            });
        } catch (e) {
            console.warn('[MCP] Could not setup file watcher:', e.message);
        }
    }

    async loadServers() {
        try {
            if (fs.existsSync(CONFIG_PATH)) {
                const newServers = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
                
                // Identify new servers to connect to
                for (const server of newServers) {
                    const existing = this.servers.find(s => s.id === server.id);
                    if (server.enabled && (!existing || existing.url !== server.url || !this.clients.has(server.id))) {
                        await this.connectToServer(server);
                    }
                }

                // Identify servers to disconnect
                for (const oldServer of this.servers) {
                    if (!newServers.find(s => s.id === oldServer.id)) {
                        await this.removeServer(oldServer.id);
                    }
                }

                this.servers = newServers;
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
            // Close existing client if any
            if (this.clients.has(server.id)) {
                try { await this.clients.get(server.id).client.close(); } catch (e) {}
            }

            let transport;
            const isCommand = server.url.startsWith('npx ') || server.url.startsWith('node ') || server.url.startsWith('python ');

            if (isCommand) {
                console.log(`[MCP] Starting local server: ${server.name} via command...`);
                const [cmd, ...args] = server.url.split(' ');
                transport = new StdioClientTransport({
                    command: cmd,
                    args: args,
                });
            } else {
                // Validate URL before connecting to avoid filling terminal with HTML if it's a repo link
                if (server.url.includes('github.com') && !server.url.includes('/raw/')) {
                    console.warn(`[MCP] Skipping invalid MCP URL (GitHub repo): ${server.url}`);
                    return false;
                }

                console.log(`[MCP] Connecting to ${server.name} at ${server.url}...`);
                transport = new StreamableHTTPClientTransport(new URL(server.url));
            }

            const client = new Client({
                name: 'Noir-AI-Client',
                version: '1.0.0'
            });

            await client.connect(transport);
            this.clients.set(server.id, { client, name: server.name });
            console.log(`[MCP] Connected to ${server.name} (${isCommand ? 'Local' : 'Remote'})`);
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
                // Add a 3-second timeout to prevent unresponsive MCP servers from hanging the chat
                const toolsPromise = info.client.listTools();
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Timeout waiting for tools from ${info.name}`)), 3000);
                });
                
                const toolsResult = await Promise.race([toolsPromise, timeoutPromise]);
                const tools = toolsResult.tools.map(tool => ({
                    ...tool,
                    serverId: id,
                    serverName: info.name
                }));
                allTools.push(...tools);
            } catch (error) {
                console.error(`[MCP] Failed to list tools for ${info.name}:`, error.message);
                // We don't throw here to allow other healthy servers to still provide tools
            }
        }
        return allTools;
    }

    /**
     * Skill Scout: Find relevant tools based on user message
     */
    async findRelevantTools(query) {
        const queryLower = query.toLowerCase();
        const allTools = await this.listAllTools();
        
        // Define intent categories
        const categories = {
            pdf: ['pdf', 'buat pdf', 'generate pdf', 'eksport pdf', 'export pdf'],
            doc: ['doc', 'docx', 'word', 'dokumen', 'document', 'buat dokumen'],
            ppt: ['ppt', 'pptx', 'powerpoint', 'presentation', 'presentasi', 'slide', 'deck'],
            search: ['cari', 'search', 'web', 'browsing', 'internet', 'terbaru', 'berita'],
            code: ['code', 'coding', 'program', 'developer', 'github', 'script', 'react', 'program'],
            design: ['desain', 'ui', 'ux', 'layout', 'landing page', 'mockup', 'wireframe', 'photoshop', 'figma'],
            marketing: ['marketing', 'iklan', 'ads', 'strategi', 'campaign', 'social content', 'iklan', 'promosi'],
            trading: ['trading', 'saham', 'stock', 'investasi', 'investment', 'crypto', 'signal', 'market', 'pasar'],
            brainstorm: ['brainstorm', 'ide', 'idea', 'creative', 'konsep', 'mind map', 'curah pendapat'],
            analyze: ['analisis', 'analyze', 'data', 'csv', 'hitung', 'math', 'statistik']
        };


        const matchedTools = [];
        const detectedCategories = [];

        // Identify categories based on query
        for (const [cat, keywords] of Object.entries(categories)) {
            if (keywords.some(k => queryLower.includes(k))) {
                detectedCategories.push(cat);
            }
        }

        if (detectedCategories.length === 0) return { tools: [], categories: [] };

        // Match tools based on detected categories
        for (const tool of allTools) {
            const toolName = tool.name.toLowerCase();
            const toolDesc = (tool.description || '').toLowerCase();
            const serverName = (tool.serverName || '').toLowerCase();
            
            const isMatch = detectedCategories.some(cat => {
                const keywords = categories[cat];
                // Match if:
                // 1. Tool name contains keyword
                // 2. Tool description contains keyword
                // 3. Server name contains keyword (meaning all tools in this server are specialized)
                return keywords.some(k => 
                    toolName.includes(k) || 
                    toolDesc.includes(k) || 
                    serverName.includes(k.replace(' ', '')) || // Match "socialcontent" vs "social content"
                    serverName.startsWith(cat)
                );
            });

            if (isMatch) {
                matchedTools.push(tool);
            }
        }

        return {
            tools: matchedTools,
            categories: detectedCategories
        };
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
            // Handle task-based execution requirement (-32600)
            if (error.code === -32600 || (error.message && error.message.includes('task-based execution'))) {
                console.warn(`[MCP] Tool ${toolName} requires task-based execution, attempting fallback...`);
                try {
                    // Try experimental task-based execution if available
                    if (info.client.experimental?.tasks?.callToolStream) {
                        const taskResult = await info.client.experimental.tasks.callToolStream({
                            name: toolName,
                            arguments: args
                        });
                        // Collect stream result
                        let resultContent = '';
                        for await (const chunk of taskResult) {
                            if (chunk.content) {
                                resultContent += typeof chunk.content === 'string' 
                                    ? chunk.content 
                                    : JSON.stringify(chunk.content);
                            }
                        }
                        return { content: [{ type: 'text', text: resultContent || 'Task completed' }] };
                    }
                    // If experimental API not available, return a graceful error
                    return { 
                        content: [{ 
                            type: 'text', 
                            text: `Tool "${toolName}" requires task-based execution which is not yet supported. The tool's functionality is unavailable, but I can still help you with the question directly.` 
                        }] 
                    };
                } catch (taskError) {
                    console.error(`[MCP] Task-based execution also failed for ${toolName}:`, taskError.message);
                    return { 
                        content: [{ 
                            type: 'text', 
                            text: `Tool "${toolName}" execution failed: ${taskError.message}. Proceeding without this tool.` 
                        }] 
                    };
                }
            }
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
