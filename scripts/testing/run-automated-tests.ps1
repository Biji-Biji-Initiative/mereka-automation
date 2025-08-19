#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated Playwright Test Execution Script
.DESCRIPTION
    This script runs Playwright tests with various options for environment, browser, and test suite selection.
.PARAMETER Environment
    The environment to run tests against (dev, staging, prod)
.PARAMETER Browser
    The browser to run tests on (chromium, firefox, webkit, all)
.PARAMETER TestSuite
    The test suite to run (smoke, regression, critical)
.PARAMETER Headed
    Run tests in headed mode (default: false)
.PARAMETER Workers
    Number of parallel workers (default: 5)
.PARAMETER Report
    Generate HTML report (default: true)
.PARAMETER Notify
    Send notifications on completion (default: false)
.EXAMPLE
    .\run-automated-tests.ps1 -Environment dev -Browser chromium -TestSuite smoke
.EXAMPLE
    .\run-automated-tests.ps1 -Environment staging -Browser all -TestSuite regression -Workers 3
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("chromium", "firefox", "webkit", "all")]
    [string]$Browser = "chromium",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("smoke", "regression", "critical")]
    [string]$TestSuite = "smoke",
    
    [Parameter(Mandatory=$false)]
    [bool]$Headed = $false,
    
    [Parameter(Mandatory=$false)]
    [int]$Workers = 5,
    
    [Parameter(Mandatory=$false)]
    [bool]$Report = $true,
    
    [Parameter(Mandatory=$false)]
    [bool]$Notify = $false
)

# Color output functions
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️ $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Main execution
try {
    Write-Info "Starting automated test execution..."
    Write-Info "Environment: $Environment"
    Write-Info "Browser: $Browser"
    Write-Info "Test Suite: $TestSuite"
    Write-Info "Workers: $Workers"
    Write-Info "Headed: $Headed"
    
    # Set environment variables
    $env:TEST_ENV = $Environment
    $env:CI = "true"
    
    # Build command
    $command = "npx playwright test"
    
    # Add browser selection
    if ($Browser -ne "all") {
        $command += " --project=$Browser"
    }
    
    # Add test suite selection
    switch ($TestSuite) {
        "smoke" { $command += " **/auth/login.spec.ts **/home/home-page-elements.spec.ts" }
        "critical" { $command += " **/auth/*.spec.ts **/job/job-creation/*.spec.ts" }
        "regression" { $command += " **/*.spec.ts" }
    }
    
    # Add execution options
    $command += " --workers=$Workers"
    
    if ($Headed) {
        $command += " --headed"
    }
    
    if ($Report) {
        $command += " --reporter=html"
    }
    
    Write-Info "Executing command: $command"
    
    # Execute tests
    $startTime = Get-Date
    Invoke-Expression $command
    $exitCode = $LASTEXITCODE
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    # Check results
    if ($exitCode -eq 0) {
        Write-Success "All tests passed! Duration: $($duration.ToString('hh\:mm\:ss'))"
        
        if ($Report) {
            Write-Info "Opening test report..."
            Start-Process "playwright-report/index.html"
        }
        
        if ($Notify) {
            Send-Notification -Type "Success" -Message "All tests passed in $($duration.ToString('hh\:mm\:ss'))"
        }
    } else {
        Write-Error "Some tests failed! Duration: $($duration.ToString('hh\:mm\:ss'))"
        
        if ($Report) {
            Write-Info "Opening test report for failure analysis..."
            Start-Process "playwright-report/index.html"
        }
        
        if ($Notify) {
            Send-Notification -Type "Failure" -Message "Tests failed after $($duration.ToString('hh\:mm\:ss'))"
        }
        
        exit 1
    }
    
} catch {
    Write-Error "Script execution failed: $($_.Exception.Message)"
    
    if ($Notify) {
        Send-Notification -Type "Error" -Message "Script execution failed: $($_.Exception.Message)"
    }
    
    exit 1
}

function Send-Notification {
    param(
        [string]$Type,
        [string]$Message
    )
    
    try {
        # Load configuration
        $configPath = "config/environments.json"
        if (Test-Path $configPath) {
            $config = Get-Content $configPath | ConvertFrom-Json
            
            # Send Slack notification if enabled
            if ($config.notifications.slack.enabled) {
                $slackPayload = @{
                    channel = $config.notifications.slack.channel
                    text = "🤖 **Automated Test Execution**`n**Status:** $Type`n**Message:** $Message`n**Environment:** $Environment`n**Time:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
                } | ConvertTo-Json
                
                Invoke-RestMethod -Uri $config.notifications.slack.webhookUrl -Method Post -Body $slackPayload -ContentType "application/json"
                Write-Info "Slack notification sent"
            }
            
            # Send email notification if enabled
            if ($config.notifications.email.enabled) {
                $emailParams = @{
                    SmtpServer = $config.notifications.email.smtpHost
                    Port = $config.notifications.email.smtpPort
                    From = "qa-automation@company.com"
                    To = $config.notifications.email.recipients
                    Subject = "Automated Test Execution - $Type"
                    Body = @"
Automated Test Execution Results

Status: $Type
Message: $Message
Environment: $Environment
Browser: $Browser
Test Suite: $TestSuite
Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Dashboard: [View Results](http://localhost:9323)
"@
                }
                
                Send-MailMessage @emailParams
                Write-Info "Email notification sent"
            }
        }
    } catch {
        Write-Warning "Failed to send notification: $($_.Exception.Message)"
    }
}

# Schedule task function
function Register-AutomatedTestTask {
    param(
        [string]$TaskName = "PlaywrightAutomatedTests",
        [string]$Schedule = "Weekly" # Daily, Weekly, Monthly
    )
    
    try {
        $scriptPath = $MyInvocation.MyCommand.Path
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$scriptPath`" -Environment staging -TestSuite regression"
        
        switch ($Schedule) {
            "Daily" { $trigger = New-ScheduledTaskTrigger -Daily -At "09:00" }
            "Weekly" { $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At "09:00" }
            "Monthly" { $trigger = New-ScheduledTaskTrigger -Monthly -DaysOfMonth 1 -At "09:00" }
        }
        
        $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
        
        Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings
        Write-Success "Scheduled task '$TaskName' registered for $Schedule execution"
    } catch {
        Write-Error "Failed to register scheduled task: $($_.Exception.Message)"
    }
}

# Uncomment to register weekly automated tests
# Register-AutomatedTestTask -TaskName "PlaywrightWeeklyTests" -Schedule "Weekly" 