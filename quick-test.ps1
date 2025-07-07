#!/usr/bin/env pwsh

Write-Host "Quick Job Creation Test" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green

# Set environment to live
$env:TEST_ENV = "live"

Write-Host "Environment: $env:TEST_ENV" -ForegroundColor Yellow
Write-Host "Starting job creation test..." -ForegroundColor Yellow

# Run the specific job creation test
try {
    npx playwright test mereka-automation/job/job-creation/create-job-post.spec.ts --project=chromium --workers=1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Job Creation Test PASSED!" -ForegroundColor Green
        Write-Host "GitHub Actions should work fine!" -ForegroundColor Green
    } else {
        Write-Host "Job Creation Test FAILED!" -ForegroundColor Red
        Write-Host "Check the test output above for details." -ForegroundColor Red
    }
} catch {
    Write-Host "Error running test: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test completed at $(Get-Date)" -ForegroundColor Cyan 