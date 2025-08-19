# 🚀 Complete MCP Setup Guide: ClickUp & Slack Integration

## Overview
This guide walks you through setting up Model Context Protocol (MCP) servers for ClickUp and Slack integration with Cursor IDE. By the end, you'll have working MCP tools for task management and team communication.

## Prerequisites ✅

### Required Software
- **Node.js** (v16 or higher)
- **Cursor IDE** (latest version)
- **Git** (for version control)
- **PowerShell** or Terminal access

### Required Accounts & Permissions
- **ClickUp account** with API access
- **Slack workspace** with admin permissions
- **GitHub account** (optional, for GitHub MCP)

## Phase 1: ClickUp MCP Setup 📋

### Step 1: Get ClickUp API Token
1. **Log into ClickUp** → Go to your workspace
2. **Navigate to Settings** → Click your profile picture → "Apps"
3. **Generate API Token** → Click "Generate" → Copy the token
4. **Get Team ID** → In ClickUp URL, find the number (e.g., `app.clickup.com/2627356/`)

**Example Token Format:** `pk_66733245_76BVBTVC88U8QUMWSOAW9FDRTXZ28H15`

### Step 2: Test ClickUp Connection
Create a test script to verify your token works:

```javascript
// test-clickup.js
const https = require('https');

const CLICKUP_TOKEN = 'your_token_here';
const TEAM_ID = 'your_team_id_here';

const options = {
  hostname: 'api.clickup.com',
  path: '/api/v2/team',
  headers: { 'Authorization': CLICKUP_TOKEN }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    if (response.teams) {
      console.log('✅ ClickUp connection successful!');
      console.log('Teams:', response.teams.map(t => `${t.name} (${t.id})`));
    } else {
      console.error('❌ Connection failed:', response);
    }
  });
});
```

### Step 3: Get List IDs
Find your target lists for task creation:

```javascript
// get-clickup-lists.js
const https = require('https');

const CLICKUP_TOKEN = 'your_token_here';
const SPACE_ID = 'your_space_id'; // Found in ClickUp URLs

const options = {
  hostname: 'api.clickup.com',
  path: `/api/v2/space/${SPACE_ID}/list`,
  headers: { 'Authorization': CLICKUP_TOKEN }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    if (response.lists) {
      console.log('📋 Available Lists:');
      response.lists.forEach(list => {
        console.log(`• ${list.name} (ID: ${list.id})`);
      });
    }
  });
});
```

## Phase 2: Slack MCP Setup 💬

### Step 1: Create Slack App
1. **Go to** [https://api.slack.com/apps](https://api.slack.com/apps)
2. **Click "Create New App"** → "From scratch"
3. **App Name:** `MCP Integration` (or your choice)
4. **Workspace:** Select your target workspace

### Step 2: Configure OAuth Scopes
In your Slack app settings:

1. **Go to "OAuth & Permissions"**
2. **Add Bot Token Scopes:**
   - `channels:read` - View basic channel info
   - `chat:write` - Send messages
   - `chat:write.public` - Send messages to channels app isn't in
   - `groups:read` - View private channels
   - `im:read` - View direct messages
   - `mpim:read` - View group messages

3. **Add User Token Scopes:**
   - `channels:read` - View channels
   - `chat:write` - Send messages as user
   - `groups:read` - View private channels

### Step 3: Install App & Get Tokens
1. **Install App** → Click "Install to Workspace"
2. **Copy Bot Token** → Starts with `xoxb-`
3. **Copy User Token** → Starts with `xoxp-` (this is what we'll use)

**Example Token Format:** `your-slack-token`

### Step 4: Test Slack Connection
```javascript
// test-slack.js
const https = require('https');

const SLACK_TOKEN = 'xoxp-your_token_here';

const options = {
  hostname: 'slack.com',
  path: '/api/auth.test',
  headers: { 'Authorization': `Bearer ${SLACK_TOKEN}` }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    if (response.ok) {
      console.log('✅ Slack connection successful!');
      console.log('Team:', response.team);
      console.log('User:', response.user);
    } else {
      console.error('❌ Connection failed:', response.error);
    }
  });
});
```

### Step 5: Get Channel IDs
```javascript
// get-slack-channels.js
const https = require('https');

const SLACK_TOKEN = 'xoxp-your_token_here';

const options = {
  hostname: 'slack.com',
  path: '/api/conversations.list',
  headers: { 'Authorization': `Bearer ${SLACK_TOKEN}` }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    if (response.ok) {
      console.log('📱 Available Channels:');
      response.channels.forEach(channel => {
        console.log(`• #${channel.name} (ID: ${channel.id})`);
      });
    }
  });
});
```

## Phase 3: Cursor MCP Configuration ⚙️

### Step 1: Create MCP Configuration File
Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": ["-y", "clickup-mcp-server"],
      "env": {
        "CLICKUP_API_TOKEN": "pk_your_clickup_token_here",
        "CLICKUP_TEAM_ID": "your_team_id_here"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "slack-mcp-server"],
      "env": {
        "SLACK_MCP_XOXP_TOKEN": "xoxp-your_slack_token_here",
        "SLACK_TEAM_ID": "your_slack_team_id_here"
      }
    }
  }
}
```

### Step 2: Verify MCP Package Availability
```bash
# Test ClickUp MCP Server
npx -y clickup-mcp-server --help

# Test Slack MCP Server  
npx -y slack-mcp-server --help
```

### Step 3: Restart Cursor
1. **Close Cursor completely**
2. **Reopen Cursor**
3. **Open your project**
4. **MCP tools should now be available in chat**

## Phase 4: Testing Your Setup 🧪

### Test 1: ClickUp Task Creation
```javascript
// test-clickup-task.js
const https = require('https');

const taskData = {
  list_id: "your_list_id_here",
  name: "Test Task from MCP",
  description: "This is a test task created via MCP integration",
  priority: 3,
  status: "to do"
};

const postData = JSON.stringify(taskData);

const options = {
  hostname: 'api.clickup.com',
  port: 443,
  path: `/api/v2/list/${taskData.list_id}/task`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'your_clickup_token_here'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    if (res.statusCode === 200) {
      console.log('✅ Task created!');
      console.log('Task ID:', response.id);
      console.log('URL:', response.url);
    } else {
      console.error('❌ Error:', response);
    }
  });
});

req.write(postData);
req.end();
```

### Test 2: Slack Message Sending
```javascript
// test-slack-message.js
const https = require('https');

const message = {
  channel: 'your_channel_id_here',
  text: 'Hello from MCP integration! 🚀'
};

const postData = JSON.stringify(message);

const options = {
  hostname: 'slack.com',
  port: 443,
  path: '/api/chat.postMessage',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_slack_token_here'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    if (response.ok) {
      console.log('✅ Message sent!');
      console.log('Channel:', response.channel);
      console.log('Timestamp:', response.ts);
    } else {
      console.error('❌ Error:', response.error);
    }
  });
});

req.write(postData);
req.end();
```

## Phase 5: Advanced Usage Examples 🎯

### Example 1: Automated Bug Report
```javascript
// Create bug report with standardized template
const bugReport = {
  list_id: "your_bugs_list_id",
  name: "[Bug] Login form validation issue",
  description: `🎯 Description:
Login form validation not working properly on mobile devices.

🔗 Link to Thread:
https://slack.com/channels/dev/thread123

📋 Preconditions:
- User on mobile device
- Previously entered invalid email

🔧 Steps to Reproduce:
• Open login page on mobile
• Enter invalid email
• See validation error
• Correct email format
• Try to submit

✅ Expected Result:
Form should submit successfully

❌ Actual Result:
Validation error persists

🎨 Figma Link:
[To be added]

📎 Attachments:
[Screenshots to be added]`,
  priority: 2,
  status: "to do",
  tags: ["bug", "mobile", "validation"]
};
```

### Example 2: Team Notification
```javascript
// Send structured team update
const teamUpdate = {
  channel: "your_team_channel_id",
  text: `🚀 *Sprint Update*

📋 *Tasks Completed:*
• Feature X implementation
• Bug fixes for mobile
• Performance optimization

📈 *Next Week:*
• Code review sessions
• Feature Y development
• Testing phase

🎯 *Blockers:*
None at the moment

#sprint-update #team-progress`
};
```

## Troubleshooting Guide 🔧

### Common Issues & Solutions

#### ❌ "CLICKUP_API_TOKEN environment variable required"
**Solution:** 
1. Check your `.cursor/mcp.json` file format
2. Ensure token is correctly placed in `env` section
3. Restart Cursor after configuration changes

#### ❌ "channel_not_found" Slack error
**Solutions:**
1. **Add bot to channel:** `/invite @your_bot_name`
2. **Use channel ID instead of name:** `C02GDJUE8LW` not `#general`
3. **Check bot permissions:** Ensure `chat:write` scope is enabled

#### ❌ "MCP server not found"
**Solutions:**
1. **Install MCP packages:** `npm install -g clickup-mcp-server slack-mcp-server`
2. **Check network:** Ensure `npx` can download packages
3. **Use local installation:** Install packages locally first

#### ❌ "Invalid authentication" errors
**Solutions:**
1. **Regenerate tokens:** Get fresh API tokens
2. **Check token format:** Ensure correct prefixes (`pk_` for ClickUp, `xoxp-` for Slack)
3. **Verify permissions:** Ensure tokens have required scopes

### Environment Variables Debugging
```bash
# Check if environment variables are set
echo $CLICKUP_API_TOKEN
echo $SLACK_MCP_XOXP_TOKEN

# Test environment in Node.js
node -e "console.log('ClickUp:', process.env.CLICKUP_API_TOKEN ? 'Set' : 'Missing')"
node -e "console.log('Slack:', process.env.SLACK_MCP_XOXP_TOKEN ? 'Set' : 'Missing')"
```

## Security Best Practices 🔒

### Token Management
1. **Never commit tokens** to version control
2. **Use environment variables** for sensitive data
3. **Rotate tokens regularly** (every 3-6 months)
4. **Limit token permissions** to minimum required scopes

### Access Control
1. **Create dedicated bot accounts** for MCP integration
2. **Limit channel access** to only necessary channels
3. **Monitor API usage** for unusual patterns
4. **Review app permissions** regularly

## Advanced Configuration 🚀

### Multiple Environments
```json
{
  "mcpServers": {
    "clickup-dev": {
      "command": "npx",
      "args": ["-y", "clickup-mcp-server"],
      "env": {
        "CLICKUP_API_TOKEN": "dev_token_here",
        "CLICKUP_TEAM_ID": "dev_team_id"
      }
    },
    "clickup-prod": {
      "command": "npx",
      "args": ["-y", "clickup-mcp-server"],
      "env": {
        "CLICKUP_API_TOKEN": "prod_token_here",
        "CLICKUP_TEAM_ID": "prod_team_id"
      }
    }
  }
}
```

### Custom MCP Scripts
Create wrapper scripts for complex operations:

```javascript
// scripts/mcp-workflow.js
async function createTaskAndNotify(taskData, slackChannel) {
  // 1. Create ClickUp task
  const task = await createClickUpTask(taskData);
  
  // 2. Send Slack notification
  const message = await sendSlackMessage({
    channel: slackChannel,
    text: `Task created: ${task.url}`
  });
  
  return { task, message };
}
```

## Quick Reference Card 📚

### Essential Commands
```bash
# Test ClickUp connection
curl -H "Authorization: your_token" https://api.clickup.com/api/v2/team

# Test Slack connection  
curl -H "Authorization: Bearer your_token" https://slack.com/api/auth.test

# Restart MCP servers
# (Restart Cursor IDE)

# Check MCP configuration
cat .cursor/mcp.json
```

### Key URLs
- **ClickUp API Docs:** https://clickup.com/api
- **Slack API Docs:** https://api.slack.com/
- **MCP Documentation:** https://modelcontextprotocol.io/docs
- **Cursor MCP Guide:** https://docs.cursor.com/mcp

### Token Formats
- **ClickUp:** `pk_66733245_76BVBTVC88U8QUMWSOAW9FDRTXZ28H15`
- **Slack Bot:** `xoxb-1030870860245-5748099538886-abc123`
- **Slack User:** `your-slack-token`

## Success Checklist ✅

After completing this guide, you should have:

- [ ] ClickUp API token working and tested
- [ ] Slack app created with proper permissions
- [ ] User OAuth token generated and tested
- [ ] `.cursor/mcp.json` file configured correctly
- [ ] MCP servers accessible via npx
- [ ] Task creation working in ClickUp
- [ ] Message sending working in Slack
- [ ] Both integrations tested in Cursor
- [ ] Channel IDs and List IDs documented
- [ ] Backup tokens and configuration stored securely

## Getting Help 🆘

### Common Resources
1. **ClickUp API Support:** Check ClickUp API documentation
2. **Slack API Support:** Visit Slack API documentation
3. **MCP Community:** GitHub issues for MCP servers
4. **Cursor Support:** Cursor IDE documentation

### Debug Mode
Enable verbose logging for troubleshooting:
```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": ["-y", "clickup-mcp-server", "--verbose"],
      "env": {
        "DEBUG": "clickup:*",
        "CLICKUP_API_TOKEN": "your_token",
        "CLICKUP_TEAM_ID": "your_team_id"
      }
    }
  }
}
```

## Final Notes 🎉

**Congratulations!** You now have a fully functional MCP setup with ClickUp and Slack integration. This powerful combination enables:

- **Automated task management** in ClickUp
- **Real-time team notifications** via Slack  
- **AI-powered workflow automation** through Cursor
- **Seamless project coordination** across tools

**Next Steps:**
1. Create custom workflows combining both tools
2. Set up automated reporting and notifications
3. Explore additional MCP servers (GitHub, Linear, etc.)
4. Build AI-powered task management assistants

**Pro Tip:** Start with simple use cases and gradually build more complex automations as you become comfortable with the MCP ecosystem.

Happy automating! 🚀 