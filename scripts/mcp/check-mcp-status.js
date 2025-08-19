#!/usr/bin/env node

console.log('🔍 MCP Diagnostic Check\n');

// Check if MCP servers are globally installed
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('1. Checking global MCP installations...');
try {
  execSync('npm list -g clickup-mcp-server', { encoding: 'utf8' });
  console.log('   ✅ clickup-mcp-server: INSTALLED');
} catch (e) {
  console.log('   ❌ clickup-mcp-server: NOT FOUND');
}

try {
  execSync('npm list -g slack-mcp-server', { encoding: 'utf8' });
  console.log('   ✅ slack-mcp-server: INSTALLED');
} catch (e) {
  console.log('   ❌ slack-mcp-server: NOT FOUND');
}

try {
  execSync('npm list -g @modelcontextprotocol/server-github', { encoding: 'utf8' });
  console.log('   ✅ github-mcp-server: INSTALLED');
} catch (e) {
  console.log('   ❌ github-mcp-server: NOT FOUND');
}

console.log('\n2. Checking .cursor/mcp.json...');
const mcpConfigPath = '.cursor/mcp.json';
if (fs.existsSync(mcpConfigPath)) {
  console.log('   ✅ .cursor/mcp.json: EXISTS');
  try {
    const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    console.log('   ✅ JSON format: VALID');
    console.log(`   📊 Configured servers: ${Object.keys(config.mcpServers).length}`);
    Object.keys(config.mcpServers).forEach(server => {
      console.log(`      - ${server}`);
    });
  } catch (e) {
    console.log('   ❌ JSON format: INVALID');
  }
} else {
  console.log('   ❌ .cursor/mcp.json: NOT FOUND');
}

console.log('\n3. Environment Variables Status...');
const requiredEnvVars = [
  'CLICKUP_API_TOKEN',
  'CLICKUP_TEAM_ID',
  'SLACK_MCP_XOXP_TOKEN',
  'SLACK_TEAM_ID',
  'GITHUB_PERSONAL_ACCESS_TOKEN'
];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✅ ${envVar}: SET`);
  } else {
    console.log(`   ⚠️  ${envVar}: NOT SET (OK - defined in .cursor/mcp.json)`);
  }
});

console.log('\n📋 SUMMARY:');
console.log('If servers are installed and config exists, the issue is likely:');
console.log('1. Cursor needs restart to load MCP servers');
console.log('2. MCP initialization timing in this chat session');
console.log('3. Try opening a NEW chat session after restart');

console.log('\n🚀 NEXT STEPS:');
console.log('1. Close ALL Cursor windows');
console.log('2. Wait 5 seconds');
console.log('3. Reopen Cursor');
console.log('4. Open NEW chat session');
console.log('5. Test: mcp_clickup_get_workspaces({random_string: "test"})'); 