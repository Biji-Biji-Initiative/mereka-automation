# Simple Daily Test Script
# This script runs the job creation test daily

# Set environment to live
$env:TEST_ENV = "live"

# Navigate to project directory
Set-Location "C:\Users\ASUS\OneDrive\Documents\Cursor"

# Run the job creation test
Write-Host "Starting job creation test at $(Get-Date)"
npx playwright test mereka-automation/job/job-creation/create-job-post.spec.ts --workers=1

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Job creation test passed at $(Get-Date)"
} else {
    Write-Host "FAILED: Job creation test failed at $(Get-Date)"
}

# Keep log for review
Write-Host "Test completed at $(Get-Date)" 