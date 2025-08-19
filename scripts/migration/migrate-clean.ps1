# Clean Migration Script for Mereka Automation Project
Write-Host "Starting project reorganization..." -ForegroundColor Green

# Step 1: Create new directory structure
Write-Host "Creating directory structure..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "docs" -Force | Out-Null
New-Item -ItemType Directory -Path "config\test-data" -Force | Out-Null
New-Item -ItemType Directory -Path "tests\fixtures\page-objects" -Force | Out-Null
New-Item -ItemType Directory -Path "tests\fixtures\test-data" -Force | Out-Null
New-Item -ItemType Directory -Path "tests\fixtures\helpers" -Force | Out-Null
New-Item -ItemType Directory -Path "artifacts\downloads" -Force | Out-Null
New-Item -ItemType Directory -Path "artifacts\test-results" -Force | Out-Null
New-Item -ItemType Directory -Path "artifacts\playwright-report" -Force | Out-Null
New-Item -ItemType Directory -Path "artifacts\screenshots" -Force | Out-Null
New-Item -ItemType Directory -Path "infrastructure\docker" -Force | Out-Null
New-Item -ItemType Directory -Path "infrastructure\ci" -Force | Out-Null

# Step 2: Move documentation
Write-Host "Moving documentation files..." -ForegroundColor Cyan
$docFiles = @(
    "AUTOMATION_PLAN.md",
    "AUTOMATION-GUIDE.md",
    "api-keys-setup.md",
    "STAGEHAND_SETUP.md",
    "STAGEHAND_EXECUTIVE_SUMMARY.md",
    "STAGEHAND_EXPERIENCE_CREATION_SUMMARY.md"
)

foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "docs\" -Force
        Write-Host "Moved: $file" -ForegroundColor Green
    }
}

# Step 3: Move scripts
Write-Host "Moving scripts..." -ForegroundColor Cyan
$scriptFiles = @(
    "daily-test-scheduler.ps1",
    "simple-daily-test.ps1",
    "test-live.ps1",
    "run-tests.ps1",
    "run-tests.sh",
    "run-stagehand-demo.ps1",
    "update-stagehand-config.ps1"
)

foreach ($file in $scriptFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "scripts\" -Force
        Write-Host "Moved: $file" -ForegroundColor Green
    }
}

# Step 4: Move infrastructure files
Write-Host "Moving infrastructure files..." -ForegroundColor Cyan
if (Test-Path "Dockerfile") {
    Move-Item -Path "Dockerfile" -Destination "infrastructure\docker\" -Force
    Write-Host "Moved: Dockerfile" -ForegroundColor Green
}

if (Test-Path "docker-compose.yml") {
    Move-Item -Path "docker-compose.yml" -Destination "infrastructure\docker\" -Force
    Write-Host "Moved: docker-compose.yml" -ForegroundColor Green
}

if (Test-Path "Jenkinsfile") {
    Move-Item -Path "Jenkinsfile" -Destination "infrastructure\ci\" -Force
    Write-Host "Moved: Jenkinsfile" -ForegroundColor Green
}

# Step 5: Rename mereka-automation to tests
Write-Host "Reorganizing tests..." -ForegroundColor Cyan
if (Test-Path "mereka-automation") {
    if (Test-Path "tests") {
        Write-Host "Merging mereka-automation into tests..." -ForegroundColor Yellow
        Get-ChildItem "mereka-automation" | Move-Item -Destination "tests" -Force
        Remove-Item "mereka-automation" -Force -Recurse
    } else {
        Rename-Item "mereka-automation" "tests"
        Write-Host "Renamed: mereka-automation to tests" -ForegroundColor Green
    }
}

# Step 6: Move test artifacts
Write-Host "Moving test artifacts..." -ForegroundColor Cyan
if (Test-Path "test-results") {
    Move-Item -Path "test-results" -Destination "artifacts\" -Force
    Write-Host "Moved: test-results" -ForegroundColor Green
}

if (Test-Path "playwright-report") {
    Move-Item -Path "playwright-report" -Destination "artifacts\" -Force
    Write-Host "Moved: playwright-report" -ForegroundColor Green
}

if (Test-Path "downloads") {
    if ((Get-ChildItem "downloads" -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0) {
        Get-ChildItem "downloads" | Move-Item -Destination "artifacts\downloads" -Force
    }
    Remove-Item "downloads" -Force -Recurse
    Write-Host "Moved: downloads content" -ForegroundColor Green
}

Write-Host ""
Write-Host "Migration completed successfully!" -ForegroundColor Green
Write-Host "Your project is now organized!" -ForegroundColor Yellow 