# 🔐 GitHub Secrets Setup Guide

## 🎯 **Required GitHub Secrets**

To deploy the Enhanced AI Bug Router via GitHub Actions, you need to set up these secrets in your repository.

### 📋 **How to Add GitHub Secrets**

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below:

## 🔑 **Required Secrets**

### **1. OPENAI_API_KEY**
```
Name: OPENAI_API_KEY
Value: sk-your-actual-openai-api-key
```
**How to get:**
- Go to https://platform.openai.com/api-keys
- Click "Create new secret key"
- Copy the key (starts with `sk-`)

### **2. CLICKUP_API_TOKEN** ✅ (You already have this)
```
Name: CLICKUP_API_TOKEN
Value: pk_66733245_76BVBTVC88U8QUMWSOAW9FDRTXZ28H15
```
**Status:** ✅ Already working in your existing system

### **3. SLACK_TOKEN** ✅ (You already have this)
```
Name: SLACK_TOKEN
Value: your-slack-bot-token
```
**Status:** ✅ Already working in your existing system

### **4. SLACK_CHANNEL** ✅ (You already have this)
```
Name: SLACK_CHANNEL
Value: C02GDJUE8LW
```
**Status:** ✅ Already configured for Mereka team channel

### **5. GITHUB_TOKEN** (Optional but recommended)
```
Name: GITHUB_TOKEN
Value: your-github-personal-access-token
```
**How to get:**
- Go to GitHub Settings → Developer settings → Personal access tokens
- Generate new token with `repo` permissions
- Copy the token

## 🚀 **Quick Setup Checklist**

- [ ] **OPENAI_API_KEY** - Get from OpenAI platform
- [x] **CLICKUP_API_TOKEN** - Already have: `pk_66733245_76BVBTVC88U8QUMWSOAW9FDRTXZ28H15`
- [x] **SLACK_TOKEN** - Already have: `xoxp-1030870860245-...`
- [x] **SLACK_CHANNEL** - Already have: `C02GDJUE8LW`
- [ ] **GITHUB_TOKEN** - Optional for GitHub integration

## ✅ **Deployment Options**

### **Option 1: Automatic Daily (Recommended)**
Once secrets are set up, the system will run automatically every day at 8:00 AM Malaysia time.

### **Option 2: Manual Trigger**
You can trigger the workflow manually:
1. Go to **Actions** tab in GitHub
2. Click **Enhanced AI Bug Router**
3. Click **Run workflow**
4. Choose **test mode** for testing

### **Option 3: Test Mode**
Test the system safely:
1. Go to **Actions** → **Enhanced AI Bug Router**
2. Click **Run workflow**
3. Check **Run in test mode**
4. Click **Run workflow**

## 🧪 **Testing the Setup**

### **Test in Demo Mode (No API keys needed)**
```bash
cd scripts/ai-bug-router-enhanced
node test-demo.js
```

### **Test with Real API Keys**
```bash
cd scripts/ai-bug-router-enhanced
node main.js health
```

### **Test Classification**
```bash
cd scripts/ai-bug-router-enhanced
node main.js test
```

## 📊 **Monitoring**

### **GitHub Actions Logs**
- All workflow runs are logged in the Actions tab
- Download artifacts for detailed logs
- Health checks run after each execution

### **Slack Notifications**
- Daily summaries sent to your Slack channel
- Real-time notifications for escalations
- Error alerts if system fails

## 🛡️ **Security Best Practices**

✅ **Do:**
- Use GitHub Secrets for all sensitive data
- Regularly rotate API keys
- Monitor workflow logs for issues
- Test in demo mode first

❌ **Don't:**
- Put API keys directly in code
- Share secrets in plain text
- Skip testing before production deployment

## 🔄 **Updating the System**

When you make changes to the Enhanced AI Bug Router:
1. Push changes to your repository
2. GitHub Actions will automatically use the updated code
3. No need to redeploy - it's all automated!

## 🎯 **Expected Results**

Once deployed, you'll see:
- ✅ Daily GitHub Actions runs at 8:00 AM Malaysia time
- ✅ Slack notifications with daily summaries
- ✅ ClickUp tickets created for real bugs
- ✅ Educational responses for user issues
- ✅ Team emoji controls working
- ✅ Duplicate prevention active

## 📞 **Support**

If you encounter issues:
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Test locally with `node main.js health`
4. Check the QUICK_SETUP_GUIDE.md for troubleshooting

---

**Ready to deploy? Set up your OpenAI API key and you're good to go!** 🚀
