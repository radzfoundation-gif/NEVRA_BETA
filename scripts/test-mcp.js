#!/usr/bin/env node
/**
 * Simple MCP Test - Verify MCP server is responding
 * Run this AFTER starting MCP server with: npm run mcp:dev
 */

import { spawn } from 'child_process';

console.log('🧪 Testing MCP Server Connection...\n');

// Simple test: try to connect via stdio
const mcpProcess = spawn('node', ['mcp-server/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit'],
});

let hasResponse = false;

// Send a simple request to list resources
const listResourcesRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'resources/list',
    params: {},
};

mcpProcess.stdin.write(JSON.stringify(listResourcesRequest) + '\n');

mcpProcess.stdout.on('data', (data) => {
    const response = data.toString();
    console.log('📥 Received from MCP server:');
    console.log(response);
    hasResponse = true;

    // Try to parse as JSON
    try {
        const parsed = JSON.parse(response);
        if (parsed.result && parsed.result.resources) {
            console.log('\n✅ MCP Server is working!');
            console.log(`   Found ${parsed.result.resources.length} resources:`);
            parsed.result.resources.forEach((r, i) => {
                console.log(`   ${i + 1}. ${r.name} - ${r.uri}`);
            });
        }
    } catch (e) {
        // Response might not be JSON, that's ok for initial messages
    }

    setTimeout(() => {
        mcpProcess.kill();
        process.exit(0);
    }, 1000);
});

mcpProcess.on('error', (error) => {
    console.error('❌ Error connecting to MCP server:', error);
    process.exit(1);
});

// Timeout after 5 seconds
setTimeout(() => {
    if (!hasResponse) {
        console.error('❌ No response from MCP server after 5 seconds');
        console.log('\n💡 Make sure MCP server is running:');
        console.log('   npm run mcp:dev');
        mcpProcess.kill();
        process.exit(1);
    }
}, 5000);
