# Stagehand Demo Runner
# This script runs the Stagehand demo tests with proper environment setup

Write-Host "🎭 Starting Stagehand Demo Tests..." -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan

# Set environment variable for live testing
$env:TEST_ENV = "live"

# Display environment info
Write-Host "Environment: $env:TEST_ENV" -ForegroundColor Yellow
Write-Host "Running Stagehand demo tests..." -ForegroundColor Yellow

# Run the demo tests
Write-Host "`n🚀 Executing Stagehand Demo Tests..." -ForegroundColor Green
npx playwright test mereka-automation/auth/login-stagehand-demo.spec.ts --headed --project chromium

Write-Host "`n✅ Demo tests completed!" -ForegroundColor Green
Write-Host "Check the README at mereka-automation/auth/STAGEHAND_README.md for more information." -ForegroundColor Cyan 