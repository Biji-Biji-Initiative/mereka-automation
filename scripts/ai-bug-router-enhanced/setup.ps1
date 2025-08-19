# Enhanced AI Bug Router Setup Script (PowerShell)
# Automates the setup process for Windows

Write-Host "🚀 Enhanced AI Bug Router Setup" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 14+ and try again." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Check if environment file exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating environment configuration file..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "⚠️  Please edit .env file with your actual API keys before running" -ForegroundColor Yellow
} else {
    Write-Host "✅ Environment file already exists" -ForegroundColor Green
}

# Test basic functionality
Write-Host "🧪 Running basic functionality test..." -ForegroundColor Yellow
try {
    node test-demo.js | Out-Null
    Write-Host "✅ Basic functionality test passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Basic functionality test failed" -ForegroundColor Red
    exit 1
}

# Check if all required files are present
$requiredFiles = @(
    "main.js",
    "enhanced-issue-classifier.js", 
    "issue-tracker.js",
    "user-education-system.js",
    "emoji-feedback-handler.js",
    "enhanced-daily-workflow.js",
    "package.json",
    "README.md"
)

Write-Host "📋 Checking required files..." -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file is missing" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎯 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your API keys:" -ForegroundColor White
Write-Host "   - OPENAI_API_KEY (required for classification)" -ForegroundColor Gray
Write-Host "   - CLICKUP_API_TOKEN (required for ticket creation)" -ForegroundColor Gray
Write-Host "   - SLACK_TOKEN (required for notifications)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test the system:" -ForegroundColor White
Write-Host "   npm run test     # Run demo with sample issues" -ForegroundColor Gray
Write-Host "   npm run health   # Check system health" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy to production:" -ForegroundColor White
Write-Host "   npm run prod     # Run daily workflow" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - README.md - Complete feature documentation" -ForegroundColor Gray
Write-Host "   - INTEGRATION_GUIDE.md - Integration with existing systems" -ForegroundColor Gray
Write-Host ""
Write-Host "🎮 Emoji Controls:" -ForegroundColor Cyan
Write-Host "   🆘 - Add to Slack message to trigger AI Bug Router" -ForegroundColor White
Write-Host "   🚨 - React to escalate issue (override AI decision)" -ForegroundColor White
Write-Host "   🙋 - React to mark as user education issue" -ForegroundColor White
Write-Host "   🤖 - React to add to AI training dataset" -ForegroundColor White
Write-Host ""
Write-Host "✨ Ready to enhance your bug routing workflow!" -ForegroundColor Green
