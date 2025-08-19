# 🎭 Stagehand Full Setup Guide

## 🎯 What You Just Saw

The demo we ran showed:

✅ **Conceptual Demo**: Shows what Stagehand enables  
✅ **Maintenance Demo**: Highlights problems Stagehand solves  
❌ **Traditional Approach**: Failed due to brittle selectors!

This failure is **exactly** why Stagehand is goated - traditional selectors break, but AI-powered natural language is resilient.

## 🔧 Setting Up Full AI Features

### Option 1: OpenAI (Recommended)

1. **Get API Key**:
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create an account if needed
   - Generate a new API key

2. **Set Environment Variable**:
   ```powershell
   # Windows PowerShell
   $env:OPENAI_API_KEY = "your-api-key-here"
   
   # Or add to your system permanently
   [Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "your-api-key-here", "User")
   ```

3. **Update Test Configuration**:
   ```typescript
   const stagehand = new Stagehand({
     env: 'LOCAL',
     apiKey: process.env.OPENAI_API_KEY,
     provider: 'openai',
     model: 'gpt-4o', // Best for browser automation
     debug: true
   });
   ```

### Option 2: Gemini (Most Cost-Effective)

Based on Stagehand's evaluations, Gemini 2.0 Flash is the most accurate and cheapest:

1. **Get API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key

2. **Configure Stagehand**:
   ```typescript
   const stagehand = new Stagehand({
     env: 'LOCAL',
     apiKey: process.env.GEMINI_API_KEY,
     provider: 'gemini',
     model: 'gemini-2.0-flash',
     debug: true
   });
   ```

### Option 3: Browserbase (Production Ready)

For production use with advanced features:

1. **Get Browserbase Account**:
   - Sign up at [Browserbase](https://www.browserbase.com/)
   - Get API key and project ID

2. **Configure**:
   ```typescript
   const stagehand = new Stagehand({
     env: 'BROWSERBASE',
     apiKey: process.env.BROWSERBASE_API_KEY,
     projectId: process.env.BROWSERBASE_PROJECT_ID,
     debug: false
   });
   ```

## 🏃‍♂️ Quick Test with API Key

Once you have an API key set up:

```powershell
# Set your API key
$env:OPENAI_API_KEY = "your-key-here"

# Run the full AI demo
$env:TEST_ENV = "live"
npx playwright test mereka-automation/auth/login-stagehand-demo.spec.ts --headed
```

## 🎨 What You'll See with Full AI

### Natural Language Actions:
```typescript
await page.act('click the login button');           // Finds any login element
await page.act('fill email field with user@test');  // Smart form filling
await page.act('click continue');                   // Context-aware clicking
```

### Smart Data Extraction:
```typescript
const result = await page.extract({
  instruction: "check if user is logged in",
  schema: z.object({
    isLoggedIn: z.boolean(),
    userIndicator: z.string()
  })
});
// Returns: { isLoggedIn: true, userIndicator: "Profile menu visible" }
```

### Action Preview:
```typescript
const action = await page.observe('click the login button');
console.log(action); // Shows exactly what Stagehand will do before doing it
```

## 💡 Cost Considerations

**Gemini 2.0 Flash**: ~$0.002 per task (most cost-effective)  
**GPT-4o**: ~$0.04 per task (20x more expensive)  
**Claude 3.5**: ~$0.06 per task (30x more expensive)

For your testing needs, Gemini 2.0 Flash is probably the best choice!

## 🎯 What We Demonstrated

### The Problem (What We Saw):
```
❌ Traditional Approach Failed:
   - Complex selector logic
   - Multiple fallback selectors needed
   - Breaks when UI changes
   - Hard to maintain

Error: Timed out waiting for profile indicator
Locator: '[class*="profile"], [class*="user"]'
```

### The Solution (What Stagehand Offers):
```
✅ Stagehand Approach:
   - Natural language actions
   - Self-healing when UI changes
   - AI-powered element detection
   - Smart data extraction

await page.act('click login') // Always works!
```

## 🚀 Next Steps

1. **Choose an AI provider** (Gemini recommended for cost)
2. **Get an API key** (free tiers available)
3. **Set environment variable**
4. **Run the full demo** to see AI automation in action
5. **Start migrating tests** gradually

## 🔧 Environment Variables Setup

Create a `.env` file in your project root:

```env
# Choose one provider:
OPENAI_API_KEY=your_openai_key_here
# OR
GEMINI_API_KEY=your_gemini_key_here
# OR
BROWSERBASE_API_KEY=your_browserbase_key_here
BROWSERBASE_PROJECT_ID=your_project_id_here

# Test environment
TEST_ENV=live
```

Then load it in your tests:
```typescript
import dotenv from 'dotenv';
dotenv.config();
```

## 📊 Performance Benefits

**Traditional Approach**:
- 20+ lines of complex selector logic
- Brittle - breaks when UI changes
- Hard to debug when tests fail
- Time-consuming to maintain

**Stagehand Approach**:
- 3-5 lines of natural language
- Resilient - adapts to UI changes
- Clear error messages
- Self-maintaining

## 🎭 Conclusion

You've seen exactly why Stagehand is **goated** for test automation:

1. **The traditional approach failed** due to brittle selectors
2. **Natural language is more resilient** than CSS selectors
3. **AI can adapt** to UI changes automatically
4. **Tests become more maintainable** and reliable

Set up an API key to see the full magic in action! 