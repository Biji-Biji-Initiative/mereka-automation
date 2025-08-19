# MCP Setup Guide: Cursor + ClickUp + Slack Integration

## 🎯 Overview

This guide will help you set up Model Context Protocol (MCP) to connect Cursor AI with ClickUp and Slack, enabling your AI assistant to:

- ✅ Create and manage ClickUp tasks
- ✅ Send Slack messages and notifications  
- ✅ Access project data in real-time
- ✅ Automate workflows between tools

## 📋 Prerequisites

- Cursor IDE installed
- Node.js 18+ installed
- ClickUp workspace access
- Slack workspace admin access

## 🔑 Step 1: Get API Credentials

### ClickUp API Token

1. Go to [ClickUp Apps](https://app.clickup.com/apps)
2. Click **Create an app** or use personal token
3. For personal use: Go to **Settings** > **Apps** > **API Token**
4. Copy your API token (starts with `pk_`)
5. Get your Team ID from ClickUp URL: `https://app.clickup.com/{TEAM_ID}/`

### Slack Bot Token

1. Go to [Slack API](https://api.slack.com/apps)
2. Click **Create New App** > **From scratch**
3. Name your app (e.g., "Cursor AI Assistant")
4. Select your workspace
5. Go to **OAuth & Permissions**
6. Add these Bot Token Scopes:
   - `chat:write`
   - `channels:read`
   - `groups:read`
   - `im:read`
   - `mpim:read`
   - `users:read`
7. Click **Install to Workspace**
8. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### Get Slack IDs

```bash
# Get Team ID (first part of any Slack URL)
# https://TEAM_ID.slack.com/...

# Get Channel IDs
# Right-click channel > View channel details > Channel ID
```

## ⚙️ Step 2: Configure Cursor MCP

### Option A: Global Configuration (Recommended)

Create/edit Cursor's global MCP config:

**Windows:** `%APPDATA%\Cursor\User\globalStorage\cursor-mcp\mcp_config.json`
**macOS:** `~/Library/Application Support/Cursor/User/globalStorage/cursor-mcp/mcp_config.json`
**Linux:** `~/.config/Cursor/User/globalStorage/cursor-mcp/mcp_config.json`

```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": ["-y", "clickup-mcp-server"],
      "env": {
        "CLICKUP_API_TOKEN": "pk_your_actual_token_here",
        "CLICKUP_TEAM_ID": "your_team_id_here"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-actual-token-here",
        "SLACK_TEAM_ID": "T01234567",
        "SLACK_CHANNEL_IDS": "C01234567,C76543210"
      }
    }
  }
}
```

### Option B: Project-Specific Configuration

Place the config file in your project root: `.cursor/mcp_config.json`

## 🚀 Step 3: Restart Cursor

1. Completely close Cursor
2. Reopen Cursor
3. Open your project
4. Press `Cmd+L` (Mac) or `Ctrl+L` (Windows) to open chat
5. **Important:** Select **Claude 3.5 Sonnet** as your model (MCP doesn't work with GPT models)

## ✅ Step 4: Test the Setup

### Test ClickUp Integration

```
Ask Claude: "What tools do you have access to?"
```

You should see ClickUp tools listed. Then try:

```
Ask Claude: "Create a ClickUp task called 'Fix login bug' in the development space"
```

### Test Slack Integration

```
Ask Claude: "Send a message to #general channel saying 'MCP integration is working!'"
```

## 🛠️ Available Commands

### ClickUp Commands

- Create tasks
- List spaces/folders/lists
- Update task status
- Add comments
- Set assignees and due dates
- Create subtasks

Example:
```
"Create a high-priority task 'Implement MCP integration' assigned to John, due tomorrow"
```

### Slack Commands

- Send messages to channels
- Send direct messages
- List channels
- Get channel info
- Post formatted messages

Example:
```
"Send a formatted message to #dev-team with a summary of today's completed tasks from ClickUp"
```

## 🔧 Advanced Configuration

### Environment Variables

Create a `.env` file in your project:

```env
# ClickUp
CLICKUP_API_TOKEN=pk_your_token_here
CLICKUP_TEAM_ID=your_team_id

# Slack  
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_TEAM_ID=T01234567
SLACK_CHANNEL_IDS=C01234567,C76543210
```

### Custom Scripts

Create a simple MCP server script for complex workflows:

```javascript
// scripts/workflow-mcp-server.js
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');

const server = new Server('workflow-automation');

server.addTool({
  name: 'create_bug_workflow',
  description: 'Create a complete bug workflow: ClickUp task + Slack notification',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      priority: { type: 'string' },
      channel: { type: 'string' }
    }
  }
}, async (params) => {
  // Custom logic combining ClickUp + Slack
  // This would call both APIs in sequence
});
```

## 🐛 Troubleshooting

### Common Issues

1. **"No MCP servers found"**
   - Verify you're using Claude model (not GPT)
   - Check config file location and syntax
   - Restart Cursor completely

2. **Authentication errors**
   - Verify API tokens are correct
   - Check token permissions
   - Ensure team/workspace access

3. **Command not working**
   - Verify Node.js 18+ is installed
   - Check network connectivity
   - Review Cursor logs

### Debug Mode

Add to your config for verbose logging:
```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": ["-y", "clickup-mcp-server", "--debug"],
      "env": {
        "DEBUG": "true",
        "CLICKUP_API_TOKEN": "..."
      }
    }
  }
}
```

## 🎉 Example Workflows

### Workflow 1: Bug Report to Task
```
"I found a bug in the login form - it's not validating email format properly. 
Create a ClickUp task for this, assign it to the frontend team, set priority to high, 
and notify the #dev-team channel in Slack."
```

### Workflow 2: Sprint Planning
```
"List all tasks in the current sprint from ClickUp and send a summary 
to #project-updates with completion percentages."
```

### Workflow 3: Daily Standup
```
"Get my assigned tasks from ClickUp that are due today and create a 
standup update message for #daily-standup."
```

## 🔐 Security Best Practices

1. **Store tokens securely** - Use environment variables
2. **Limit token permissions** - Only grant necessary scopes
3. **Regular token rotation** - Update tokens periodically
4. **Monitor usage** - Check API usage in platform dashboards
5. **Use project-specific configs** - Avoid global tokens when possible

## 📚 Additional Resources

- [MCP Official Documentation](https://modelcontextprotocol.io/)
- [ClickUp API Documentation](https://clickup.com/api)
- [Slack API Documentation](https://api.slack.com/)
- [Cursor MCP Integration Guide](https://cursor.sh/docs/mcp)

---

**Happy automating! 🚀** Your AI assistant can now manage your projects and communications seamlessly. 