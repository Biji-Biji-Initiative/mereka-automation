# Daily Job Creation Test Script
# This script runs the job creation test in both dev and live environments

param(
    [string]$Environment = "both",  # Options: dev, live, both
    [int]$Workers = 5
)

# Set script location
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Split-Path -Parent $ScriptDir

# Change to project directory
Set-Location $ProjectRoot

Write-Host "Starting Daily Job Creation Tests..." -ForegroundColor Green
Write-Host "Date: $(Get-Date)" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot" -ForegroundColor Cyan

# Function to run tests in specific environment
function Run-JobCreationTest {
    param([string]$Env, [int]$Workers)
    
    Write-Host "`nRunning Job Creation Test in $Env environment..." -ForegroundColor Yellow
    
    $env:TEST_ENV = $Env
    $TestResult = npx playwright test mereka-automation/job/job-creation/create-job-post.spec.ts --workers=$Workers
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Job Creation Test PASSED in $Env environment" -ForegroundColor Green
        return $true
    } else {
        Write-Host "FAILED: Job Creation Test FAILED in $Env environment" -ForegroundColor Red
        return $false
    }
}

# Run tests based on environment parameter
$Results = @()

if ($Environment -eq "both") {
    $Results += Run-JobCreationTest -Env "dev" -Workers $Workers
    $Results += Run-JobCreationTest -Env "live" -Workers $Workers
} else {
    $Results += Run-JobCreationTest -Env $Environment -Workers $Workers
}

# Summary
Write-Host "`nTest Summary:" -ForegroundColor Cyan
$PassCount = ($Results | Where-Object { $_ -eq $true }).Count
$TotalCount = $Results.Count

if ($PassCount -eq $TotalCount) {
    Write-Host "SUCCESS: All tests PASSED ($PassCount/$TotalCount)" -ForegroundColor Green
    exit 0
} else {
    Write-Host "WARNING: Some tests FAILED ($PassCount/$TotalCount)" -ForegroundColor Yellow
    exit 1
} 