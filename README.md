# 🤖 Mereka Automation System

> **AI-Powered Bug Routing & Continuous Monitoring for Mereka Platform**

This repository contains the automated systems that power intelligent bug routing and issue management across the Mereka platform repositories.

## 🎯 What This System Does

### **Intelligent Bug Routing**
- **Slack Integration**: React with `:sos:` to automatically create structured bug reports
- **AI Analysis**: GPT-4 analyzes bug descriptions and extracts technical details
- **Smart Routing**: Routes issues to correct repositories based on content analysis
- **Cross-Platform Sync**: Creates linked tasks in ClickUp and GitHub

### **Background Monitoring** 
- **Continuous Scanning**: Every 5 minutes, scans all repositories for routing improvements
- **Re-routing**: Moves issues to more appropriate repositories when confidence improves
- **Status Sync**: Keeps ClickUp and GitHub statuses synchronized
- **Developer Notifications**: Alerts teams about new issues with context

### **Code Fix Generation**
- **AI Analysis**: Identifies issues suitable for automated fixes
- **Code Generation**: Creates actual code solutions for simple problems
- **Draft PRs**: Generates pull requests with suggested changes
- **Human Review**: All automated changes require developer approval

## 🏗️ Architecture

```
Slack :sos: → Cloud Function → AI Analysis → Smart Routing
                                     ↓
GitHub Issues ← Background Agent ← Repository Scanner
     ↓                ↑                    ↓
ClickUp Tasks ← Status Sync → Code Fix Generator → Draft PRs
```

## 🎯 Target Repositories

- **`mereka-web`**: Frontend issues (UI, components, user experience)
- **`mereka-web-ssr`**: SSR/SEO issues (performance, indexing, meta tags)
- **`mereka-cloudfunctions`**: Backend issues (API, auth, payments, data)
- **`mereka-automation`**: Testing, deployment, and automation issues

## 📊 Monitoring & Analytics

### **Real-Time Monitoring**
- **Cloud Function Logs**: Live processing and routing decisions
- **GitHub Actions**: Background agent activity and performance
- **ClickUp Integration**: Task creation and status updates
- **Slack Notifications**: Team alerts and confirmations

### **Success Metrics**
- **Routing Accuracy**: % of issues correctly routed on first attempt
- **Response Time**: Time from Slack to GitHub issue creation
- **Developer Satisfaction**: Team feedback on automated routing quality
- **Fix Success Rate**: % of automated code fixes accepted by developers

## 🚀 Getting Started

### **For Users (Reporting Bugs)**
1. **In Slack**: React with `:sos:` to any message describing a bug
2. **Wait 2-3 seconds**: System processes and creates structured reports
3. **Get Confirmation**: Slack shows ClickUp task + GitHub issue links
4. **Track Progress**: Monitor status in both ClickUp and GitHub

### **For Developers (Managing Issues)**
1. **Check Notifications**: GitHub issues include AI analysis and routing confidence
2. **Review Context**: Issues contain original Slack context and technical analysis
3. **Use Draft PRs**: Review and merge automated code fixes when appropriate
4. **Provide Feedback**: Manual re-routing improves AI learning

## 🔧 Configuration

### **Repository Registry**
```javascript
{
  'mereka-web': ['frontend', 'ui', 'react', 'component', 'mobile', 'css'],
  'mereka-web-ssr': ['ssr', 'seo', 'performance', 'meta', 'sitemap'],
  'mereka-cloudfunctions': ['api', 'auth', 'payment', 'database', 'webhook'],
  'mereka-automation': ['test', 'deploy', 'ci-cd', 'automation']
}
```

### **Confidence Thresholds**
- **Auto-route**: ≥ 70% confidence
- **Manual review**: < 70% confidence
- **Code fix generation**: ≥ 80% confidence for simple issues

## 📋 Workflow Examples

### **Frontend Bug Example**
```
Slack Message: "Login form validation errors persist on mobile Safari"
↓
AI Analysis: {
  keywords: ['login', 'form', 'validation', 'mobile', 'safari', 'ui'],
  confidence: 0.95,
  target: 'mereka-web'
}
↓
Result: Issue created in mereka-web with full analysis
```

### **Backend API Example**
```
Slack Message: "Payment webhook returning 500 errors for Stripe"
↓
AI Analysis: {
  keywords: ['payment', 'webhook', 'stripe', 'api', '500', 'server'],
  confidence: 0.98,
  target: 'mereka-cloudfunctions'
}
↓
Result: Issue created in mereka-cloudfunctions with technical context
```

## 🤝 Contributing

This system learns and improves from team feedback:

1. **Manual Re-routing**: When you move issues between repositories, the AI learns
2. **Code Review**: Feedback on automated fixes improves future suggestions
3. **Keyword Updates**: Add new terms to repository registry as needed
4. **Threshold Tuning**: Adjust confidence levels based on accuracy

## 🆘 Support

- **GitHub Issues**: Report automation bugs or feature requests
- **Slack**: `#automation` channel for questions and discussion
- **Documentation**: Check `/docs` for detailed guides
- **Logs**: Monitor Cloud Function logs for troubleshooting

---

**🎉 Ready to revolutionize your bug reporting workflow?** The AI is standing by to help! 🤖✨
