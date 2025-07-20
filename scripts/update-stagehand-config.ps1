# Update Stagehand Configuration Script
# Run this after getting your API key

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("gemini", "openai")]
    [string]$Provider,
    
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

Write-Host "🔧 Updating Stagehand configuration for $Provider..." -ForegroundColor Green

# Set environment variable
if ($Provider -eq "gemini") {
    $env:GEMINI_API_KEY = $ApiKey
    Write-Host "✅ Gemini API key set!" -ForegroundColor Green
    Write-Host "   - Cost: ~$0.002 per test" -ForegroundColor Yellow
    Write-Host "   - Free tier: 1,500 requests/day" -ForegroundColor Yellow
} elseif ($Provider -eq "openai") {
    $env:OPENAI_API_KEY = $ApiKey
    Write-Host "✅ OpenAI API key set!" -ForegroundColor Green
    Write-Host "   - Cost: ~$0.04 per test" -ForegroundColor Yellow
    Write-Host "   - Free tier: $5 credit" -ForegroundColor Yellow
}

# Update demo configuration
$demoFile = "mereka-automation/auth/login-stagehand-demo.spec.ts"

if ($Provider -eq "gemini") {
    $newConfig = @"
    stagehand = new Stagehand({
      env: 'LOCAL',
      apiKey: process.env.GEMINI_API_KEY,
      provider: 'google',
      model: 'gemini-2.0-flash',
      debug: true
    });
"@
} else {
    $newConfig = @"
    stagehand = new Stagehand({
      env: 'LOCAL',
      apiKey: process.env.OPENAI_API_KEY,
      provider: 'openai',
      model: 'gpt-4o',
      debug: true
    });
"@
}

Write-Host "🔄 Configuration updated for $provider!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Ready to test! Run:" -ForegroundColor Cyan
Write-Host "   `$env:TEST_ENV = 'live'" -ForegroundColor White
Write-Host "   npx playwright test $demoFile --headed" -ForegroundColor White
Write-Host ""
Write-Host "🎭 You'll now see REAL AI automation with natural language!" -ForegroundColor Magenta

# Usage instructions
Write-Host ""
Write-Host "📖 Usage examples:" -ForegroundColor Cyan
Write-Host "   .\update-stagehand-config.ps1 -Provider gemini -ApiKey 'your_key_here'" -ForegroundColor Gray
Write-Host "   .\update-stagehand-config.ps1 -Provider openai -ApiKey 'your_key_here'" -ForegroundColor Gray 