# 🚀 Helper Prompt: Setting Up ClickUp & Slack MCP Integration

## Quick Prompt for Helping Someone

Hey! I'll help you set up ClickUp and Slack MCP (Model Context Protocol) integration with Cursor IDE. This will give you AI-powered task management and team communication tools.

**What we'll accomplish:**
- ✅ Create tasks in ClickUp using AI commands
- ✅ Send messages to Slack channels automatically  
- ✅ Combine both for powerful workflow automation
- ✅ Have everything working in ~30 minutes

**What you'll need:**
- Cursor IDE installed
- ClickUp account (any plan)
- Slack workspace admin access
- Node.js installed

## Step-by-Step Questions

**Let's start! Please answer these step by step:**

### 1. **Environment Check**
Do you have these installed?
- [ ] Cursor IDE (latest version)
- [ ] Node.js (v16+) - Check with `node --version`
- [ ] Git - Check with `git --version`

If missing any, install them first.

### 2. **ClickUp Setup**
**Get your ClickUp API token:**
1. Go to ClickUp → Click your profile → "Apps" 
2. Click "Generate" under API Token
3. Copy the token (starts with `pk_`)

**Find your Team ID:**
- Look at your ClickUp URL: `app.clickup.com/[TEAM_ID]/`
- Copy that number

**Share with me (replace with your actual values):**
- ClickUp Token: `pk_YOUR_TOKEN_HERE`
- Team ID: `YOUR_TEAM_ID`

### 3. **Slack Setup**
**Create a Slack app:**
1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "MCP Integration" 
4. Select your workspace

**Configure permissions:**
1. Go to "OAuth & Permissions"
2. Add these User Token Scopes:
   - `channels:read`
   - `chat:write` 
   - `groups:read`

3. Click "Install to Workspace"
4. Copy the "User OAuth Token" (starts with `xoxp-`)

**Share with me:**
- Slack Token: `xoxp-YOUR_TOKEN_HERE`
- Workspace name: `YOUR_WORKSPACE`

### 4. **Get Channel ID**
**Find your target channel ID:**
- Right-click any Slack channel → "Copy link"
- The ID is at the end: `slack.com/archives/C02GDJUE8LW`
- Copy the `C02GDJUE8LW` part

**Share with me:**
- Channel ID: `YOUR_CHANNEL_ID`
- Channel name: `#your-channel-name`

### 5. **Create Configuration**
I'll help you create the `.cursor/mcp.json` file with your tokens.

### 6. **Test Everything**
We'll run test scripts to make sure everything works before finalizing.

## Ready to Start?

Just answer the questions above step by step, and I'll guide you through each part! 

**Pro tip:** Have ClickUp and Slack open in separate tabs so you can easily switch between them.

**Estimated time:** 30 minutes total
**Difficulty:** Easy (copy-paste setup)
**Result:** Powerful AI automation tools! 🚀

---

*Once we're done, you'll be able to say things like "Create a task for bug fix in ClickUp and notify the team in Slack" and it will happen automatically!* 