# Daily Test Scheduler Setup Script
# Run this script as Administrator to set up daily automated testing

# Set up the task to run daily at 9 AM
$TaskName = "MerekaPlaywrightTests"
$ScriptPath = "C:\Users\ASUS\OneDrive\Documents\Cursor\scripts\run-automated-tests.ps1"
$WorkingDirectory = "C:\Users\ASUS\OneDrive\Documents\Cursor"

# Create the scheduled task
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`"" -WorkingDirectory $WorkingDirectory
$Trigger = New-ScheduledTaskTrigger -Daily -At 9:00AM
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Register the task
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Run Mereka Playwright tests daily"

Write-Host "SUCCESS: Daily test schedule created successfully!"
Write-Host "SCHEDULE: Tests will run every day at 9:00 AM"
Write-Host "LOCATION: You can modify this in Windows Task Scheduler"
Write-Host "MANUAL: To run tests manually: $ScriptPath" 