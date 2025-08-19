# Send Clean Slack Notification About Bug Ticket Creation

$slackToken = "YOUR_SLACK_USER_TOKEN_HERE"
$channelId = "C02GDJUE8LW"  # team-connect-dev-internal channel

# Bug ticket information
$taskId = "86czu3zzq"
$taskUrl = "https://app.clickup.com/t/86czu3zzq"

$message = @"
🐛 Bug Report Created

Issue: Job application proposed section not working properly
ClickUp Task: $taskUrl

Steps to Reproduce:
1. Go to any expert account (example: tataxa5948@lewou.com)
2. Apply to any job
3. Go back to your dashboard
4. Click on 'all job application' -> 'proposed section'

Priority: High (2)
Status: To Do

Original Thread: https://bijimereka.slack.com/archives/C02GDJUE8LW/p1753754814535219

Additional Context: The job application and job contract pages should display listings in descending order, with the most recent first.

This issue has been logged and is ready for investigation by the development team.
"@

$body = @{
    channel = $channelId
    text = $message
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $slackToken"
    "Content-Type" = "application/json"
}

try {
    Write-Host "Sending clean Slack notification..."
    $response = Invoke-RestMethod -Uri "https://slack.com/api/chat.postMessage" -Method POST -Headers $headers -Body $body
    
    if ($response.ok) {
        Write-Host "Slack notification sent successfully!"
        Write-Host "Message timestamp: $($response.ts)"
    } else {
        Write-Host "Slack API error: $($response.error)"
    }
    
} catch {
    Write-Host "Error sending Slack notification:"
    Write-Host "Error: $($_.Exception.Message)"
    throw
} 