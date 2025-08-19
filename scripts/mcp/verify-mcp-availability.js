/**
 * MCP Tools Availability Checker
 * Run this script in any new Cursor chat to verify MCP tools are working
 */

console.log('🔍 MCP Tools Availability Checker');
console.log('=====================================\n');

// Check if we're in a Cursor environment
console.log('📋 Environment Check:');
console.log(`✅ Node.js Version: ${process.version}`);
console.log(`✅ Current Directory: ${process.cwd()}`);
console.log(`✅ Platform: ${process.platform}\n`);

// Check for MCP configuration file
const fs = require('fs');
const path = require('path');

const mcpConfigPath = path.join(process.cwd(), '.cursor', 'mcp.json');
console.log('🔧 MCP Configuration Check:');

if (fs.existsSync(mcpConfigPath)) {
  console.log('✅ .cursor/mcp.json file exists');
  
  try {
    const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    console.log(`✅ MCP servers configured: ${Object.keys(config.mcpServers).join(', ')}`);
    
    // Check each server configuration
    Object.entries(config.mcpServers).forEach(([name, server]) => {
      console.log(`   📌 ${name}: ${server.command} ${server.args.join(' ')}`);
    });
  } catch (error) {
    console.log('❌ Error reading MCP config:', error.message);
  }
} else {
  console.log('❌ .cursor/mcp.json file NOT found');
  console.log('   📍 Expected location:', mcpConfigPath);
}

console.log('\n🧪 Quick MCP Test Instructions:');
console.log('=====================================');
console.log('In your Cursor chat, try these commands to test MCP tools:');
console.log('');
console.log('1. Test ClickUp MCP:');
console.log('   mcp_clickup_get_workspaces({random_string: "test"})');
console.log('');
console.log('2. Test Slack MCP:');
console.log('   mcp_slack_channels_list({channel_types: "public_channel", limit: 5})');
console.log('');
console.log('3. Test GitHub MCP:');
console.log('   mcp_github_search_repositories({query: "test", per_page: 5})');
console.log('');

console.log('🛠️  Troubleshooting Guide:');
console.log('=====================================');
console.log('If MCP tools are not available in a new chat:');
console.log('');
console.log('1. ✅ Restart Cursor completely');
console.log('2. ✅ Ensure .cursor/mcp.json is in project root');
console.log('3. ✅ Check that all MCP servers are properly installed');
console.log('4. ✅ Verify environment variables in MCP config');
console.log('5. ✅ Wait 10-15 seconds after opening new chat for MCP to initialize');
console.log('');

console.log('📚 Pro Tips:');
console.log('=====================================');
console.log('• MCP tools should auto-load in every new chat session');
console.log('• If tools are missing, try typing "mcp_" and see if autocomplete works');
console.log('• Some MCP servers may take time to start up on first use');
console.log('• Check Cursor Developer Console (F12) for MCP error messages');
console.log('');

console.log('🎯 Quick Fix Command:');
console.log('If MCP is still not working, run: npm install -g clickup-mcp-server slack-mcp-server @modelcontextprotocol/server-github'); 