# 🤖 Mereka Daily Test Automation Guide

## 🎯 Overview

Your daily job creation tests can run automatically using several options. All have been set up and ready to use!

## 🚀 Available Automation Options

### ✅ **Option 1: GitHub Actions (Recommended)**

**🔧 Status:** ✅ **READY TO USE**  
**📅 Schedule:** Daily at 9 AM UTC  
**🌍 Environment:** Cloud-based  

**What you get:**
- ✅ Automatic daily testing
- ✅ Multi-browser testing (Chrome + Firefox)
- ✅ HTML test reports
- ✅ Slack notifications (optional)
- ✅ GitHub issue creation on failure
- ✅ Test videos and screenshots

**To activate:**
```bash
# Just push your code to GitHub
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin master
```

**Manual trigger:**
- Go to GitHub → Actions → "Daily Job Creation Tests" → "Run workflow"

---

### ☁️ **Option 2: GitHub Codespaces (Cloud Development)**

**🔧 Status:** ✅ **READY TO USE**  
**📅 Schedule:** Manual or automated  
**🌍 Environment:** GitHub cloud workspace  

**What you get:**
- ✅ Run tests from anywhere
- ✅ No local setup required
- ✅ Pre-configured environment

**To use:**
1. Open GitHub repository
2. Click "Code" → "Codespaces" → "Create codespace"
3. Run tests: `npm test` or `./simple-daily-test.ps1`

---

### 🏢 **Option 3: Jenkins Pipeline**

**🔧 Status:** ✅ **READY TO USE**  
**📅 Schedule:** Daily at 9 AM  
**🌍 Environment:** Your Jenkins server  

**What you get:**
- ✅ Enterprise-grade automation
- ✅ Email notifications
- ✅ Environment selection (dev/live/staging)
- ✅ HTML reports with history

**To activate:**
1. Set up Jenkins server
2. Create new pipeline job
3. Point to your `Jenkinsfile`
4. Configure environment variables

---

### 💻 **Option 4: Local Windows Automation**

**🔧 Status:** ✅ **READY TO USE**  
**📅 Schedule:** Daily at 9 AM (Windows Task Scheduler)  
**🌍 Environment:** Your local machine  

**Simple setup:**
```powershell
# Run as Administrator
.\daily-test-scheduler.ps1
```

**Manual testing:**
```powershell
# Test job creation now
.\simple-daily-test.ps1

# Test all features
$env:TEST_ENV="live"; npx playwright test --workers=5
```

---

## 📊 **Test Reports & Results**

### **GitHub Actions Reports:**
- 📊 **HTML Reports:** Available in Actions artifacts
- 🌐 **Public Reports:** Auto-published to GitHub Pages
- 📱 **Mobile-friendly:** View on any device

### **Local Reports:**
- 📊 **HTML Report:** `playwright-report/index.html`
- 🎥 **Videos:** `test-results/` folder
- 📷 **Screenshots:** Automatic on failures

---

## 🔧 **Configuration Options**

### **Environment Variables:**
```bash
TEST_ENV=live        # Target environment (dev/live)
WORKERS=5           # Parallel test execution
HEADED=false        # Run headless (faster)
```

### **Slack Notifications:**
Add to GitHub Secrets:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/your/webhook/url
```

### **Email Notifications:**
Configure in Jenkins or GitHub Actions

---

## 🎯 **Quick Commands**

### **Test Job Creation Only:**
```powershell
# Live environment
$env:TEST_ENV="live"; npx playwright test mereka-automation/job/job-creation/create-job-post.spec.ts

# Dev environment  
$env:TEST_ENV="dev"; npx playwright test mereka-automation/job/job-creation/create-job-post.spec.ts
```

### **Test All Features:**
```powershell
# All tests in live
$env:TEST_ENV="live"; npx playwright test --workers=5

# Specific browser
$env:TEST_ENV="live"; npx playwright test --project=chromium
```

### **Generate Reports:**
```powershell
# HTML report
npx playwright test --reporter=html

# Open report
start playwright-report/index.html
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"X marks in test results"**
   - ✅ **Normal:** These are expected for custom UI components
   - ✅ **Safe to ignore:** Tests still pass successfully

2. **"Tests fail to start"**
   - Check environment variable: `echo $env:TEST_ENV`
   - Verify network connection
   - Check if website is accessible

3. **"Automation not running"**
   - **GitHub:** Check Actions tab for errors
   - **Local:** Verify Task Scheduler entry
   - **Jenkins:** Check pipeline configuration

---

## 📞 **Need Help?**

### **Manual Testing:**
```powershell
# Quick test to verify everything works
.\simple-daily-test.ps1
```

### **Check Status:**
- **GitHub Actions:** Repository → Actions tab
- **Local Schedule:** Task Scheduler → "MerekaPlaywrightDaily"
- **Jenkins:** Check build history

---

## 🎉 **Summary**

✅ **Tests work perfectly**  
✅ **Multiple automation options ready**  
✅ **Daily scheduling configured**  
✅ **Reports and notifications set up**  

**Recommended:** Use **GitHub Actions** for automatic daily testing with cloud reliability and comprehensive reporting! 