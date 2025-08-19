# Create Test Task in ClickUp and Notify Slack
param(
    [string]$TaskName = "[Issue] Test task from automation",
    [string]$SlackMessage = "test"
)

# ClickUp Configuration
$ClickUpToken = "YOUR_CLICKUP_API_TOKEN_HERE"
$ListId = "900501824745"  # All bugs list

# Slack Configuration
$SlackToken = "YOUR_SLACK_USER_TOKEN_HERE"
$SlackChannel = "C02GDJUE8LW"  # team connect dev internal

Write-Host "Creating test task in ClickUp..." -ForegroundColor Yellow

# Create ClickUp task with standardized template
$taskDescription = "🎯 Description:`nThis is a test task created via automation to verify ClickUp MCP integration and workflow automation.`n`n🔗 Link to Thread:`nAutomation test - no external thread`n`n📋 Preconditions:`n- ClickUp API integration must be working`n- Automation scripts must have proper permissions`n`n🔧 Steps to Reproduce:`n• Run automation script`n• Verify task creation`n• Check Slack notification`n`n✅ Expected Result:`nTask should be created successfully and team should be notified via Slack`n`n❌ Actual Result:`n[To be updated based on test results]`n`n🎨 Figma Link:`n[Not applicable for automation test]`n`n📎 Attachments:`n[None for this test]"

$clickUpBodyHashtable = @{
    name = $TaskName
    description = $taskDescription
    priority = 3
    status = "to do"
}

$clickUpBody = $clickUpBodyHashtable | ConvertTo-Json -Depth 3

try {
    $clickUpResponse = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/list/$ListId/task" -Method POST -Headers @{
        "Authorization" = $ClickUpToken
        "Content-Type" = "application/json"
    } -Body $clickUpBody

    $taskId = $clickUpResponse.id
    $taskUrl = $clickUpResponse.url
    
    Write-Host "✅ ClickUp task created successfully!" -ForegroundColor Green
    Write-Host "Task ID: $taskId" -ForegroundColor Cyan
    Write-Host "Task URL: $taskUrl" -ForegroundColor Cyan

    # Now send Slack notification
    Write-Host "`nSending Slack notification..." -ForegroundColor Yellow
    
    $slackBodyHashtable = @{
        channel = $SlackChannel
        text = "$SlackMessage`n`n🎯 New task created: *$TaskName*`n📋 Task ID: $taskId`n🔗 Link: $taskUrl"
    }
    
    $slackBody = $slackBodyHashtable | ConvertTo-Json

    $slackResponse = Invoke-RestMethod -Uri "https://slack.com/api/chat.postMessage" -Method POST -Headers @{
        "Authorization" = "Bearer $SlackToken"
        "Content-Type" = "application/json"
    } -Body $slackBody

    if ($slackResponse.ok) {
        Write-Host "✅ Slack notification sent successfully!" -ForegroundColor Green
        Write-Host "Message timestamp: $($slackResponse.ts)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Slack notification failed: $($slackResponse.error)" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Automation workflow completed!" -ForegroundColor Magenta 