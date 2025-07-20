# Simple Backup Script for Mereka Automation Project
$backupDir = "backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"

Write-Host "Creating backup before reorganization..." -ForegroundColor Green
Write-Host "Backup directory: $backupDir" -ForegroundColor Yellow

# Create backup directory
New-Item -ItemType Directory -Path $backupDir -Force

# Copy files excluding large directories
$excludePatterns = @("node_modules", ".git", "test-results", "playwright-report")

Get-ChildItem -Path "." | Where-Object { 
    $_.Name -notin $excludePatterns 
} | ForEach-Object {
    $destPath = Join-Path $backupDir $_.Name
    if ($_.PSIsContainer) {
        Copy-Item -Path $_.FullName -Destination $destPath -Recurse -Force
        Write-Host "Copied directory: $($_.Name)" -ForegroundColor Green
    } else {
        Copy-Item -Path $_.FullName -Destination $destPath -Force
        Write-Host "Copied file: $($_.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Backup completed successfully!" -ForegroundColor Green
Write-Host "Backup location: $((Get-Location).Path)\$backupDir" -ForegroundColor Yellow
Write-Host "You can now run the migration script safely." -ForegroundColor Green 