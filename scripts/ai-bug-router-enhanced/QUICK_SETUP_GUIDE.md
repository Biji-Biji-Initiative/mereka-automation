# 🚀 Quick Setup Guide - Enhanced AI Bug Router

## ✅ **Step 1: System Ready**
Your Enhanced AI Bug Router is installed and ready! All dependencies are set up.

## 🔧 **Step 2: Configure API Keys**

You need to edit the `.env` file with your actual API keys. Here's how to get them:

### 🔑 **Required API Keys**

#### **1. OpenAI API Key** (Required for AI classification)
```bash
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

**How to get:**
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. Replace `your-openai-api-key-here` in `.env`

#### **2. ClickUp API Token** (You already have this!)
```bash
# You already have this configured
CLICKUP_API_TOKEN=your-clickup-api-token
```
✅ **Already configured** - this is working in your existing system!

#### **3. Slack Token** (You already have this!)
```bash
# You already have this configured  
SLACK_TOKEN=your-slack-token
```
✅ **Already configured** - this is working in your existing system!

### 🎯 **Quick Configuration (Copy & Paste)**

Edit your `.env` file and update these lines:
```bash
# REQUIRED: Get from OpenAI
OPENAI_API_KEY=sk-your-actual-openai-key-here

# ALREADY WORKING: Use your existing keys
CLICKUP_API_TOKEN=your-existing-clickup-token
SLACK_TOKEN=your-existing-slack-token
SLACK_CHANNEL=C02GDJUE8LW

# OPTIONAL: For GitHub PR creation
GITHUB_TOKEN=your-github-token-here
```

## 🧪 **Step 3: Test the System**

Once you have the OpenAI API key configured:

```bash
# Test without API keys (demo mode)
node test-demo.js

# Test with real API keys
node main.js health

# Test classification with real OpenAI
node main.js test
```

## 🚀 **Step 4: Deploy to Production**

### **Option A: Add to GitHub Actions (Recommended)**

Create `.github/workflows/enhanced-ai-bug-router.yml`:
```yaml
name: Enhanced AI Bug Router

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at 8 AM Malaysia time
  workflow_dispatch:

jobs:
  enhanced-bug-router:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd scripts/ai-bug-router-enhanced
          npm install
          
      - name: Run Enhanced AI Bug Router
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          CLICKUP_API_TOKEN: ${{ secrets.CLICKUP_API_TOKEN }}
          SLACK_TOKEN: ${{ secrets.SLACK_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          cd scripts/ai-bug-router-enhanced
          node main.js daily
```

### **Option B: Manual Daily Run**
```bash
# Run the daily workflow manually
cd scripts/ai-bug-router-enhanced
node main.js daily
```

## 🎮 **Step 5: Set Up Emoji Controls**

### **Slack App Configuration**
Your existing Slack app needs these additional permissions:
- `reactions:read` - To detect emoji reactions
- `reactions:write` - To add confirmation reactions

### **Webhook Setup**
Add this to your existing Slack webhook handler:
```javascript
// Handle emoji reactions
app.event('reaction_added', async ({ event, client }) => {
  const { EmojiFeedbackHandler } = require('./scripts/ai-bug-router-enhanced/emoji-feedback-handler.js');
  const handler = new EmojiFeedbackHandler(
    process.env.CLICKUP_API_TOKEN,
    process.env.SLACK_TOKEN
  );
  await handler.handleReactionAdded(event);
});
```

## 🎯 **Team Training: How to Use Emoji Controls**

Train your team on these controls:

### **🆘 SOS Emoji** (Already working!)
- Add to any Slack message to trigger AI Bug Router
- Example: "Login not working 🆘"

### **New Emoji Controls** (React to AI responses)
- **🚨** - Escalate issue (override AI decision) 
- **🙋** - Mark as user education issue
- **🤖** - Add to AI training dataset

### **Example Workflow:**
1. User reports: "Can't find experience creation 🆘"
2. AI responds: "Sending educational guide (user education)"
3. If it's actually a bug, team member adds 🚨 reaction
4. System creates urgent bug ticket and starts code generation

## 📊 **Daily Monitoring**

The system will send daily summaries to your Slack channel showing:
- Issues processed
- Classification accuracy
- Duplicates prevented
- Time saved
- Actions taken

## 🛠️ **Troubleshooting**

### **Common Issues:**

**"Missing OpenAI API Key"**
- Solution: Add your OpenAI API key to `.env` file

**"Classification failed"**
- Solution: Check OpenAI API key and internet connection

**"Emoji reactions not working"**
- Solution: Check Slack app permissions and webhook setup

### **Health Check:**
```bash
node main.js health
```

## 🎉 **Success!**

Once configured, your Enhanced AI Bug Router will:
- ✅ Intelligently classify all bug reports
- ✅ Prevent false bug fixes for user education issues
- ✅ Eliminate duplicate PR chaos
- ✅ Provide team override controls
- ✅ Save 10+ hours per week of developer time

**You're ready to revolutionize your issue management!** 🚀

---

**Next:** Get your OpenAI API key and update the `.env` file, then test with `node main.js health`!
