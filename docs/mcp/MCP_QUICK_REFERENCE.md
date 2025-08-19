# MCP Tools Quick Reference Guide

## 🎯 For New Chat Sessions

**If you're an AI agent in a new Cursor chat session, read this:**

✅ **MCP tools ARE configured and working in this project**  
✅ **ClickUp integration is fully operational**  
⚠️ **Slack integration has MCP tool issues but direct API works**

## 🔧 Quick Setup Verification

### Test MCP Tools Are Available:
```bash
# Run this PowerShell script to verify everything:
./scripts/verify-mcp-tools.ps1
```

### Test ClickUp MCP (should always work):
```typescript
mcp_clickup_get_workspaces({random_string: "test"})
```

### Test Slack MCP (may fail, use fallback):
```typescript
// Try this first:
mcp_slack_channels_list({channel_types: "public_channel", limit: 5})

// If it fails, use direct API:
// Run PowerShell command instead
```

## 📋 Common Tasks

### 1. Create ClickUp Task
```typescript
mcp_clickup_create_task({
  list_id: "900501824745",  // "All bugs" list
  name: "Your task name",
  description: "Task description", 
  priority: 2,              // 1=urgent, 2=high, 3=normal, 4=low
  status: "to do"
})
```

### 2. Send Slack Message (PowerShell fallback)
```powershell
$body = @{ 
  channel = "C02GDJUE8LW";   # Main channel
  text = "Your message here" 
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://slack.com/api/chat.postMessage" -Method POST `
  -Headers @{"Authorization"="Bearer your-slack-user-oauth-token-here"; "Content-Type"="application/json"} `
  -Body $body
```

### 3. Complete Automation Workflow
```typescript
// Step 1: Create ClickUp task
const task = mcp_clickup_create_task({
  list_id: "900501824745",
  name: "Automation Test Task",
  description: "Created via MCP integration"
});

// Step 2: Send Slack notification (use PowerShell command)
// Notify about task creation with task ID and URL
```

## 🗂️ Key Information

### ClickUp Details:
- **Workspace**: Mereka (ID: 2627356)
- **Main List**: "All bugs" (ID: 900501824745)  
- **Status**: ✅ Fully operational via MCP tools

### Slack Details:
- **Team**: Mereka & Biji-biji Initiative Team
- **Main Channel**: C02GDJUE8LW
- **Status**: ⚠️ MCP tools unreliable, use direct API

### Configuration Files:
- **MCP Config**: `.cursor/mcp.json` (contains all tokens and IDs)
- **Project Rules**: `.cursorrules` (contains full MCP documentation)

## 🚨 Troubleshooting

### "MCP tools not available"
1. **Check**: Verify `.cursor/mcp.json` exists
2. **Test**: Try `mcp_clickup_get_workspaces()` 
3. **Restart**: Restart Cursor if needed

### "Slack MCP tools failing"
1. **Try**: MCP tools first (`mcp_slack_*`)
2. **Fallback**: Use direct PowerShell API calls
3. **Verify**: Token works with auth.test API

### "Need to convince AI that MCP tools work"
- **Reference**: This document and `.cursorrules` section
- **Test**: Run verification script
- **Demonstrate**: Show working ClickUp example

## 🎯 Success Criteria

When MCP tools are working correctly:
- ✅ ClickUp task creation succeeds
- ✅ Slack message posting works (via MCP or API)
- ✅ Full automation workflow completes
- ✅ Task IDs and URLs are properly returned

**Remember**: MCP tools are pre-configured and tested. Always assume they work unless proven otherwise! 