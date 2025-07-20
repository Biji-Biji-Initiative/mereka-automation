# 🔑 API Keys Setup Guide

## 🎯 Quick Setup (Choose One)

### **Option 1: Gemini (Recommended)**
```powershell
# Set environment variable
$env:GEMINI_API_KEY = "your_gemini_api_key_here"

# Test it works
echo $env:GEMINI_API_KEY
```

### **Option 2: OpenAI**
```powershell
# Set environment variable  
$env:OPENAI_API_KEY = "your_openai_api_key_here"

# Test it works
echo $env:OPENAI_API_KEY
```

## 🔄 Update Your Stagehand Demo

Once you have an API key, update the demo file:

### For Gemini:
```typescript
// In login-stagehand-demo.spec.ts, update the beforeEach:
test.beforeEach(async () => {
  stagehand = new Stagehand({
    env: 'LOCAL',
    apiKey: process.env.GEMINI_API_KEY,
    provider: 'google',  // Use 'google' for Gemini
    model: 'gemini-2.0-flash',
    debug: true
  });
  
  await stagehand.init();
});
```

### For OpenAI:
```typescript
// In login-stagehand-demo.spec.ts, update the beforeEach:
test.beforeEach(async () => {
  stagehand = new Stagehand({
    env: 'LOCAL', 
    apiKey: process.env.OPENAI_API_KEY,
    provider: 'openai',
    model: 'gpt-4o',
    debug: true
  });
  
  await stagehand.init();
});
```

## 🚀 Test Your Setup

```powershell
# Set your API key
$env:GEMINI_API_KEY = "your-key-here"
# OR
$env:OPENAI_API_KEY = "your-key-here"

# Set test environment
$env:TEST_ENV = "live"

# Run the AI-powered demo
npx playwright test mereka-automation/auth/login-stagehand-demo.spec.ts --headed
```

## 💰 Cost Comparison

| Provider | Cost per test | Accuracy | Speed |
|----------|---------------|----------|--------|
| **Gemini 2.0 Flash** | ~$0.002 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| OpenAI GPT-4o | ~$0.04 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Claude 3.5 | ~$0.06 | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**Recommendation**: Start with Gemini - it's the most cost-effective and accurate according to Stagehand's own evaluations!

## 🔐 Security Tips

- ✅ **Never commit API keys** to version control
- ✅ **Use environment variables** instead of hardcoding
- ✅ **Regenerate keys** if accidentally exposed
- ✅ **Set usage limits** in provider dashboards

## 🎭 What You'll See with AI

Once set up, your tests will use natural language:
```typescript
// This will actually work with AI!
await page.act("click the login button");
await page.act("fill email with testingmereka01@gmail.com"); 
await page.act("enter password and submit");

// Smart extraction
const result = await page.extract({
  instruction: "check if login was successful",
  schema: z.object({
    isLoggedIn: z.boolean(),
    userName: z.string().optional()
  })
});
```

## 🆓 Free Tiers Available

- **Gemini**: 15 requests/minute, 1,500/day (perfect for testing!)
- **OpenAI**: $5 free credit for new accounts
- **Claude**: Some free tier available

## 🎯 Next Steps

1. **Get API key** from Gemini or OpenAI (links opened above)
2. **Set environment variable**
3. **Update demo configuration** 
4. **Run the AI-powered tests**
5. **Watch the magic happen!** 🎭 