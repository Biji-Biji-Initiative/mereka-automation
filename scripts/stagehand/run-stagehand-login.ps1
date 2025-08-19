# Stagehand Login Tests Runner
# This script runs the Stagehand login tests with proper environment setup

Write-Host "🎭 Starting Stagehand Login Tests..." -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan

# Set environment variable for live testing
$env:TEST_ENV = "live"

# Display environment info
Write-Host "Environment: $env:TEST_ENV" -ForegroundColor Yellow
Write-Host "Test File: tests/auth/login-stagehand.spec.ts" -ForegroundColor Yellow

# Check for API key
if ($env:GOOGLE_API_KEY) {
    Write-Host "✅ Google API Key found" -ForegroundColor Green
} elseif ($env:OPENAI_API_KEY) {
    Write-Host "✅ OpenAI API Key found" -ForegroundColor Green
} else {
    Write-Host "⚠️  No API key found - using fallback demo key" -ForegroundColor Yellow
    Write-Host "   Set GOOGLE_API_KEY or OPENAI_API_KEY for best results" -ForegroundColor Gray
}

# Run the login tests
Write-Host "`n🚀 Executing Stagehand Login Tests..." -ForegroundColor Green
npx playwright test tests/auth/login-stagehand.spec.ts --headed --project chromium

Write-Host "`n✅ Login tests completed!" -ForegroundColor Green
Write-Host "Check test results in artifacts/playwright-report/" -ForegroundColor Cyan 