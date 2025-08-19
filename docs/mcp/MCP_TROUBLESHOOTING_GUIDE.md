# MCP Tools Troubleshooting Guide 🛠️

## Problem: MCP Tools Not Available in New Chat Sessions

If MCP tools work in one chat but disappear when you open a new chat session, this guide will help you fix the issue permanently.

## Quick Fix Checklist ✅

1. **Restart Cursor Completely**
   - Close all Cursor windows
   - Wait 5 seconds
   - Reopen Cursor and your project

2. **Verify Configuration File Exists**
   ```
   📁 Your Project Root
   └── 📁 .cursor
       └── 📄 mcp.json  ← This file must exist
   ```

3. **Wait for Initialization**
   - After opening a new chat, wait 10-15 seconds
   - MCP servers need time to start up

4. **Test MCP Availability**
   ```
   mcp_clickup_get_workspaces({random_string: "test"})
   ```

## Detailed Troubleshooting Steps 🔍

### Step 1: Check MCP Configuration

Run this script to verify your setup:
```bash
node scripts/verify-mcp-availability.js
```

Expected output should show:
- ✅ .cursor/mcp.json file exists
- ✅ MCP servers configured: clickup, slack, github

### Step 2: Ensure Global MCP Server Installation

Run the setup script to install MCP servers globally:
```powershell
./scripts/setup-mcp-global.ps1
```

Or manually install them:
```bash
npm install -g clickup-mcp-server slack-mcp-server @modelcontextprotocol/server-github
```

### Step 3: Verify Project Structure

Your project must have this exact structure:
```
Your-Project-Root/
├── .cursor/
│   └── mcp.json          ← Critical file
├── package.json
├── your other files...
```

**Important:** The `.cursor` folder must be in your project root, not in a subdirectory.

### Step 4: Check MCP Configuration Content

Your `.cursor/mcp.json` should look like this:
```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": ["-y", "clickup-mcp-server"],
      "env": {
        "CLICKUP_API_TOKEN": "your_token_here",
        "CLICKUP_TEAM_ID": "your_team_id_here"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "slack-mcp-server"],
      "env": {
        "SLACK_MCP_XOXP_TOKEN": "your_slack_token_here",
        "SLACK_TEAM_ID": "your_slack_team_here"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### Step 5: Test in New Chat Session

1. Open a new chat in Cursor
2. Wait 15 seconds for MCP initialization
3. Type `mcp_` and check if autocomplete shows MCP tools
4. Try a test command:
   ```
   mcp_clickup_get_workspaces({random_string: "test"})
   ```

## Common Issues and Solutions 🚨

### Issue 1: "MCP tools not available"
**Cause:** MCP servers not initialized
**Solution:** 
- Wait 15 seconds after opening new chat
- Restart Cursor completely
- Verify `.cursor/mcp.json` exists in project root

### Issue 2: "Environment variable required"
**Cause:** MCP configuration missing or incorrect
**Solution:**
- Check `.cursor/mcp.json` has all required tokens
- Ensure tokens are valid and not expired
- Verify JSON syntax is correct (no trailing commas)

### Issue 3: MCP tools work inconsistently
**Cause:** MCP servers not installed globally
**Solution:**
```bash
npm install -g clickup-mcp-server slack-mcp-server @modelcontextprotocol/server-github
```

### Issue 4: Cursor doesn't recognize project
**Cause:** Project not opened correctly in Cursor
**Solution:**
- Open the entire project folder in Cursor (not just files)
- Ensure you're opening the root directory containing `.cursor/mcp.json`

## Advanced Debugging 🔬

### Check Cursor Developer Console
1. Press `F12` in Cursor
2. Look for MCP-related errors
3. Check Network tab for failed MCP server connections

### Verify MCP Server Status
Create a test script to check server connectivity:
```javascript
// Test script to verify MCP server accessibility
const { spawn } = require('child_process');

const testMCPServer = (serverName, command, args) => {
  console.log(`Testing ${serverName}...`);
  const process = spawn(command, args, { 
    env: { ...process.env, ...yourEnvVars } 
  });
  
  process.on('error', (error) => {
    console.log(`❌ ${serverName} failed:`, error.message);
  });
  
  process.on('exit', (code) => {
    console.log(`${serverName} exit code:`, code);
  });
};
```

### Check Network Connectivity
Test if your API tokens work:
```bash
# Test ClickUp API
curl -H "Authorization: your_clickup_token" https://api.clickup.com/api/v2/team

# Test Slack API  
curl -H "Authorization: Bearer your_slack_token" https://slack.com/api/auth.test

# Test GitHub API
curl -H "Authorization: token your_github_token" https://api.github.com/user
```

## Prevention Tips 💡

### 1. Always Open Project Root
- Open the entire project folder in Cursor
- Don't open individual files or subdirectories

### 2. Commit MCP Configuration
- Add `.cursor/mcp.json` to your git repository (but remove sensitive tokens)
- This ensures team members have the same MCP setup

### 3. Use Environment Variables for Tokens
Consider using environment variables instead of hardcoded tokens:
```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": ["-y", "clickup-mcp-server"],
      "env": {
        "CLICKUP_API_TOKEN": "${CLICKUP_API_TOKEN}",
        "CLICKUP_TEAM_ID": "${CLICKUP_TEAM_ID}"
      }
    }
  }
}
```

### 4. Regular Verification
Run the verification script periodically:
```bash
node scripts/verify-mcp-availability.js
```

## Quick Reference Commands 📋

### Test MCP Tools Availability
```
mcp_clickup_get_workspaces({random_string: "test"})
mcp_slack_channels_list({channel_types: "public_channel", limit: 5})
mcp_github_search_repositories({query: "test", per_page: 5})
```

### Emergency Reset
If nothing works, try this complete reset:
```powershell
# 1. Delete MCP cache
Remove-Item -Recurse -Force ~/.cursor/mcp-cache -ErrorAction SilentlyContinue

# 2. Reinstall MCP servers globally
npm install -g clickup-mcp-server slack-mcp-server @modelcontextprotocol/server-github

# 3. Restart Cursor
# 4. Wait 30 seconds before testing
```

## Success Indicators ✅

You'll know MCP is working correctly when:
- New chat sessions automatically load MCP tools
- Typing `mcp_` shows autocomplete options
- MCP commands execute without "not available" errors
- All configured servers (ClickUp, Slack, GitHub) respond to test commands

## Still Having Issues? 🆘

If this guide doesn't solve your problem:

1. **Check Cursor Version:** Ensure you're using the latest version
2. **Review Cursor Documentation:** Check official MCP documentation
3. **Test with Minimal Config:** Try with just one MCP server first
4. **Contact Support:** Provide your configuration and error messages

---

**Remember:** MCP tools should work seamlessly across all chat sessions once properly configured. If they don't, the issue is usually with the configuration file location or Cursor not recognizing your project properly. 