#!/usr/bin/env pwsh

# Test Login Button Detection with Stagehand AI
# This script runs only the first test case to quickly verify if the login button detection is working

Write-Host "🚀 Testing Login Button Detection with Stagehand AI..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan

# Set environment variables
$env:TEST_ENV = "live"
$env:NODE_ENV = "test"

# Check if API key is set
if (-not $env:GOOGLE_API_KEY) {
    Write-Host "⚠️  GOOGLE_API_KEY not found. Using fallback API key for demo..." -ForegroundColor Yellow
}

# Set test timeout (5 minutes)
$env:PLAYWRIGHT_TEST_TIMEOUT = "300000"

Write-Host "🔧 Environment Configuration:" -ForegroundColor Cyan
Write-Host "  - TEST_ENV: $env:TEST_ENV" -ForegroundColor White
Write-Host "  - NODE_ENV: $env:NODE_ENV" -ForegroundColor White
Write-Host "  - API Key: $(if($env:GOOGLE_API_KEY) { "✅ Set" } else { "⚠️  Using fallback" })" -ForegroundColor White
Write-Host ""

# Run only the first test case to verify button detection
Write-Host "🧪 Running login button detection test..." -ForegroundColor Green
Write-Host "Test: 'should successfully login with valid credentials using AI'" -ForegroundColor White
Write-Host ""

try {
    # Run the specific test case
    npx playwright test tests/auth/login-stagehand.spec.ts --headed --grep "should successfully login with valid credentials using AI" --timeout=300000 --workers=1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Login button detection test PASSED!" -ForegroundColor Green
        Write-Host "The AI successfully found and clicked the login button." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Login button detection test FAILED!" -ForegroundColor Red
        Write-Host "Please check the test output above for detailed error information." -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Test execution failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Test Summary:" -ForegroundColor Cyan
Write-Host "- This test specifically focuses on the login button detection issue" -ForegroundColor White
Write-Host "- The test includes multiple fallback strategies for finding the button" -ForegroundColor White
Write-Host "- Detailed observations are logged to help debug any issues" -ForegroundColor White
Write-Host ""
Write-Host "🔍 If the test still fails, check the console output for:" -ForegroundColor Yellow
Write-Host "  - Navigation area observations" -ForegroundColor White
Write-Host "  - Button detection attempt results" -ForegroundColor White  
Write-Host "  - Final observation of available clickable elements" -ForegroundColor White
Write-Host ""
Write-Host "Done! 🎉" -ForegroundColor Green 