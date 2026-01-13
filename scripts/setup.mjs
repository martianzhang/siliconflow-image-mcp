#!/usr/bin/env node

/**
 * Setup script for SiliconFlow Image MCP
 * This script helps users configure their environment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log('🔧 SiliconFlow Image MCP Setup\n');

  // Check if API key already exists
  const envPath = path.join(process.cwd(), '.env');
  let existingKey = '';

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/SILICONFLOW_API_KEY=(.+)/);
    if (match) {
      existingKey = match[1];
      console.log('✅ Found existing API key in .env file');
    }
  }

  // Get API key
  let apiKey = existingKey;
  if (!apiKey) {
    apiKey = await ask('Enter your SiliconFlow API key: ');

    if (!apiKey.trim()) {
      console.log('❌ No API key provided. Setup cancelled.');
      process.exit(1);
    }

    // Save to .env
    const envContent = `SILICONFLOW_API_KEY=${apiKey.trim()}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ API key saved to .env file');
  }

  // Generate Claude Desktop config
  const config = {
    "mcpServers": {
      "siliconflow-image-mcp": {
        "command": "npx",
        "args": ["-y", "siliconflow-image-mcp"],
        "env": {
          "SILICONFLOW_API_KEY": apiKey.trim()
        }
      }
    }
  };

  const configPath = path.join(process.cwd(), 'examples', 'claude-desktop-config-generated.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log('\n✅ Generated Claude Desktop config at examples/claude-desktop-config-generated.json');
  console.log('\n📋 Next steps:');
  console.log('1. Copy the config to Claude Desktop:');
  console.log('   macOS: ~/Library/Application Support/Claude/claude_desktop_config.json');
  console.log('   Windows: %APPDATA%\\Claude\\claude_desktop_config.json');
  console.log('2. Restart Claude Desktop');
  console.log('3. Try: "Generate an image of a sunset"');

  rl.close();
}

main().catch(console.error);
