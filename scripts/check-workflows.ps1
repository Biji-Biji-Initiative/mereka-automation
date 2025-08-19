# GitHub Workflows Status Checker
# Run this script to verify your GitHub Actions setup

Write-Host "🔍 GitHub Actions Workflow Checker" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path ".github/workflows")) {
    Write-Host "❌ Error: .github/workflows directory not found!" -ForegroundColor Red
    Write-Host "   Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Check workflow files
Write-Host "`n📋 Checking workflow files..." -ForegroundColor Yellow
$workflowFiles = Get-ChildItem ".github/workflows/*.yml"
foreach ($file in $workflowFiles) {
    Write-Host "   ✅ Found: $($file.Name)" -ForegroundColor Green
}

# Check git status
Write-Host "`n📦 Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain .github/workflows/
if ($gitStatus) {
    Write-Host "   ⚠️  Uncommitted changes in workflow files:" -ForegroundColor Yellow
    Write-Host "   $gitStatus" -ForegroundColor White
    Write-Host "   Please commit and push these changes first." -ForegroundColor Yellow
} else {
    Write-Host "   ✅ All workflow files are committed" -ForegroundColor Green
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "`n🌿 Current branch: $currentBranch" -ForegroundColor Yellow
if ($currentBranch -eq "master" -or $currentBranch -eq "main") {
    Write-Host "   ✅ On default branch - workflows will be available" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Not on default branch - workflows might not be available" -ForegroundColor Yellow
}

# Instructions
Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to: https://github.com/Biji-Biji-Initiative/mereka-QA-automation/actions" -ForegroundColor White
Write-Host "2. Check if workflows are listed in the left sidebar" -ForegroundColor White
Write-Host "3. If missing, ensure GitHub Actions are enabled in Settings > Actions" -ForegroundColor White
Write-Host "4. Manually trigger each workflow once to activate scheduling:" -ForegroundColor White
Write-Host "   - Authentication Tests" -ForegroundColor Gray
Write-Host "   - Home & Experience Tests" -ForegroundColor Gray
Write-Host "   - Expert & Expertise Tests" -ForegroundColor Gray
Write-Host "   - Job Tests" -ForegroundColor Gray
Write-Host "5. After manual trigger, automatic schedule will activate" -ForegroundColor White

Write-Host "`n⏰ Schedule Summary:" -ForegroundColor Cyan
Write-Host "   - Authentication Tests: Monday 6:00 AM (UTC+7)" -ForegroundColor Gray
Write-Host "   - Home & Experience: Monday 6:05 AM (UTC+7)" -ForegroundColor Gray
Write-Host "   - Expert & Expertise: Monday 6:10 AM (UTC+7)" -ForegroundColor Gray
Write-Host "   - Job Tests: Monday 6:15 AM (UTC+7)" -ForegroundColor Gray

Write-Host "`n🎯 Done! Follow the steps above to activate your workflows." -ForegroundColor Green 