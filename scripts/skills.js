#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(process.cwd(), 'server', 'mcp_servers.json');

function loadConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        return [];
    }
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function saveConfig(config) {
    if (!fs.existsSync(path.dirname(CONFIG_PATH))) {
        fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

const args = process.argv.slice(2);
const command = args[0];

if (command === 'add') {
    const url = args[1];
    let name = 'New Skill';
    
    // Parse --skill flag
    const skillIndex = args.indexOf('--skill');
    if (skillIndex !== -1 && args[skillIndex + 1]) {
        name = args[skillIndex + 1];
    }

    if (!url) {
        console.error('❌ Usage: npx skills add <url> --skill <name>');
        process.exit(1);
    }

    const config = loadConfig();
    const id = Date.now().toString();
    config.push({ id, name, url, enabled: true });
    saveConfig(config);
    
    console.log(`✅ Skill added: "${name}" (${url})`);
} else if (command === 'list') {
    const config = loadConfig();
    console.log('\n📚 Available Skills:');
    if (config.length === 0) {
        console.log('   (No skills found)');
    } else {
        config.forEach((s, i) => {
            console.log(`   ${i + 1}. [${s.enabled ? 'ON' : 'OFF'}] ${s.name} - ${s.url}`);
        });
    }
    console.log('');
} else if (command === 'remove') {
    const idOrIndex = args[1];
    if (!idOrIndex) {
        console.error('❌ Usage: npx skills remove <id-or-index>');
        process.exit(1);
    }

    let config = loadConfig();
    const index = parseInt(idOrIndex) - 1;
    
    if (!isNaN(index) && config[index]) {
        const removed = config.splice(index, 1);
        saveConfig(config);
        console.log(`✅ Removed skill: "${removed[0].name}"`);
    } else {
        const filtered = config.filter(s => s.id !== idOrIndex);
        if (filtered.length < config.length) {
            saveConfig(filtered);
            console.log(`✅ Removed skill with ID: ${idOrIndex}`);
        } else {
            console.error('❌ Skill not found.');
        }
    }
} else {
    console.log(`
🚀 Noir Skills CLI
Usage:
  npx skills add <url-or-command> --skill <name>
  npx skills list
  npx skills remove <index>

Examples:
  npx skills add https://api.myserver.com/mcp --skill my-remote-skill
  npx skills add "npx @modelcontextprotocol/server-everything" --skill test-skill
  npx skills add "node ./mcp-server/index.js" --skill noir-internal
    `);
}
