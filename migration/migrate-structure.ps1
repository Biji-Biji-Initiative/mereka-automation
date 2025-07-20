# Mereka Automation Project Reorganization Script
# This script will safely reorganize your project structure

Write-Host "🚀 Starting Mereka Automation Project Reorganization..." -ForegroundColor Green
Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Yellow

# Function to create directories safely
function Create-DirectoryIfNotExists {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force
        Write-Host "✅ Created directory: $Path" -ForegroundColor Green
    } else {
        Write-Host "📁 Directory already exists: $Path" -ForegroundColor Yellow
    }
}

# Function to move files safely
function Move-FileIfExists {
    param([string]$Source, [string]$Destination)
    if (Test-Path $Source) {
        # Create destination directory if it doesn't exist
        $destDir = Split-Path -Parent $Destination
        if ($destDir) {
            Create-DirectoryIfNotExists $destDir
        }
        
        Move-Item -Path $Source -Destination $Destination -Force
        Write-Host "✅ Moved: $Source -> $Destination" -ForegroundColor Green
    } else {
        Write-Host "⚠️  File not found: $Source" -ForegroundColor Yellow
    }
}

Write-Host "`n📂 Step 1: Creating new directory structure..." -ForegroundColor Cyan

# Create main directories
Create-DirectoryIfNotExists "docs"
Create-DirectoryIfNotExists "config/test-data"
Create-DirectoryIfNotExists "tests/fixtures/page-objects"
Create-DirectoryIfNotExists "tests/fixtures/test-data"
Create-DirectoryIfNotExists "tests/fixtures/helpers"
Create-DirectoryIfNotExists "artifacts/downloads"
Create-DirectoryIfNotExists "artifacts/test-results"
Create-DirectoryIfNotExists "artifacts/playwright-report"
Create-DirectoryIfNotExists "artifacts/screenshots"
Create-DirectoryIfNotExists "infrastructure/docker"
Create-DirectoryIfNotExists "infrastructure/ci"

Write-Host "`n📝 Step 2: Moving documentation files..." -ForegroundColor Cyan

# Move documentation
Move-FileIfExists "AUTOMATION_PLAN.md" "docs/AUTOMATION_PLAN.md"
Move-FileIfExists "AUTOMATION-GUIDE.md" "docs/AUTOMATION-GUIDE.md"
Move-FileIfExists "api-keys-setup.md" "docs/api-keys-setup.md"
Move-FileIfExists "STAGEHAND_SETUP.md" "docs/STAGEHAND_SETUP.md"
Move-FileIfExists "STAGEHAND_EXECUTIVE_SUMMARY.md" "docs/STAGEHAND_EXECUTIVE_SUMMARY.md"
Move-FileIfExists "STAGEHAND_EXPERIENCE_CREATION_SUMMARY.md" "docs/STAGEHAND_EXPERIENCE_CREATION_SUMMARY.md"

Write-Host "`n🔧 Step 3: Moving scripts..." -ForegroundColor Cyan

# Ensure scripts directory exists
if (-not (Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts" -Force
}

# Move scripts from root to scripts folder
Move-FileIfExists "daily-test-scheduler.ps1" "scripts/daily-test-scheduler.ps1"
Move-FileIfExists "simple-daily-test.ps1" "scripts/simple-daily-test.ps1"
Move-FileIfExists "test-live.ps1" "scripts/test-live.ps1"
Move-FileIfExists "run-tests.ps1" "scripts/run-tests.ps1"
Move-FileIfExists "run-tests.sh" "scripts/run-tests.sh"
Move-FileIfExists "run-stagehand-demo.ps1" "scripts/run-stagehand-demo.ps1"
Move-FileIfExists "update-stagehand-config.ps1" "scripts/update-stagehand-config.ps1"

# Move scripts from existing scripts folder (if any remain)
if (Test-Path "scripts/daily-job-creation-test.ps1") {
    Write-Host "✅ Script already in correct location: scripts/daily-job-creation-test.ps1" -ForegroundColor Green
}
if (Test-Path "scripts/run-automated-tests.ps1") {
    Write-Host "✅ Script already in correct location: scripts/run-automated-tests.ps1" -ForegroundColor Green
}

Write-Host "`n🏗️ Step 4: Moving infrastructure files..." -ForegroundColor Cyan

# Move Docker and CI/CD files
Move-FileIfExists "Dockerfile" "infrastructure/docker/Dockerfile"
Move-FileIfExists "docker-compose.yml" "infrastructure/docker/docker-compose.yml"
Move-FileIfExists "Jenkinsfile" "infrastructure/ci/Jenkinsfile"

# Move .devcontainer if it exists
if (Test-Path ".devcontainer") {
    Move-Item -Path ".devcontainer" -Destination "infrastructure/.devcontainer" -Force
    Write-Host "✅ Moved: .devcontainer -> infrastructure/.devcontainer" -ForegroundColor Green
}

Write-Host "`n🧪 Step 5: Reorganizing tests..." -ForegroundColor Cyan

# Rename mereka-automation to tests
if (Test-Path "mereka-automation") {
    if (Test-Path "tests") {
        Write-Host "⚠️  tests directory already exists. Merging contents..." -ForegroundColor Yellow
        # Move contents of mereka-automation to tests
        Get-ChildItem "mereka-automation" | ForEach-Object {
            $destination = Join-Path "tests" $_.Name
            if (Test-Path $destination) {
                Write-Host "⚠️  $destination already exists, skipping..." -ForegroundColor Yellow
            } else {
                Move-Item $_.FullName $destination -Force
                Write-Host "✅ Moved: $($_.FullName) -> $destination" -ForegroundColor Green
            }
        }
        # Remove empty mereka-automation directory
        Remove-Item "mereka-automation" -Force -Recurse
    } else {
        Rename-Item "mereka-automation" "tests"
        Write-Host "✅ Renamed: mereka-automation -> tests" -ForegroundColor Green
    }
}

# Remove duplicate downloads folder from tests if it exists
if (Test-Path "tests/downloads") {
    Write-Host "🗑️  Removing duplicate downloads folder from tests..." -ForegroundColor Yellow
    Remove-Item "tests/downloads" -Force -Recurse
    Write-Host "✅ Removed duplicate downloads folder" -ForegroundColor Green
}

Write-Host "`n📊 Step 6: Moving test artifacts..." -ForegroundColor Cyan

# Move test artifacts
if (Test-Path "test-results") {
    Move-Item -Path "test-results" -Destination "artifacts/test-results" -Force
    Write-Host "✅ Moved: test-results -> artifacts/test-results" -ForegroundColor Green
}

if (Test-Path "playwright-report") {
    Move-Item -Path "playwright-report" -Destination "artifacts/playwright-report" -Force
    Write-Host "✅ Moved: playwright-report -> artifacts/playwright-report" -ForegroundColor Green
}

if (Test-Path "downloads") {
    # Move any files from downloads to artifacts/downloads
    if ((Get-ChildItem "downloads" -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0) {
        Get-ChildItem "downloads" | Move-Item -Destination "artifacts/downloads" -Force
        Write-Host "✅ Moved downloads content to artifacts/downloads" -ForegroundColor Green
    }
    Remove-Item "downloads" -Force -Recurse
    Write-Host "✅ Removed root downloads folder" -ForegroundColor Green
}

Write-Host "`n🔄 Step 7: Updating configurations..." -ForegroundColor Cyan

# Update .cursorrules path references
$cursorrules = Get-Content ".cursorrules" -Raw
$cursorrules = $cursorrules -replace "mereka-automation/", "tests/"
$cursorrules = $cursorrules -replace "downloads/", "artifacts/downloads/"
Set-Content ".cursorrules" $cursorrules
Write-Host "✅ Updated .cursorrules path references" -ForegroundColor Green

Write-Host "`n🎉 Reorganization Complete!" -ForegroundColor Green
Write-Host "📋 Summary of changes:" -ForegroundColor Yellow
Write-Host "  • Documentation moved to docs/" -ForegroundColor White
Write-Host "  • Scripts organized in scripts/" -ForegroundColor White
Write-Host "  • Infrastructure files moved to infrastructure/" -ForegroundColor White
Write-Host "  • Tests moved to tests/" -ForegroundColor White
Write-Host "  • Artifacts organized in artifacts/" -ForegroundColor White
Write-Host "  • Updated .cursorrules path references" -ForegroundColor White

Write-Host "`n⚠️  Next Steps:" -ForegroundColor Red
Write-Host "1. Update playwright.config.ts to use 'tests' instead of 'mereka-automation'" -ForegroundColor Yellow
Write-Host "2. Update package.json scripts if they reference old paths" -ForegroundColor Yellow
Write-Host "3. Update any import statements in test files" -ForegroundColor Yellow
Write-Host "4. Update CI/CD configurations with new paths" -ForegroundColor Yellow
Write-Host "5. Review and update any hardcoded paths in documentation" -ForegroundColor Yellow

Write-Host "`n✅ Your project structure is now organized and maintainable!" -ForegroundColor Green 