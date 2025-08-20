# MCP Tools Verification Script
Write-Host "🔌 MCP Tools Verification" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Test ClickUp API
Write-Host "`n✅ Testing ClickUp..." -ForegroundColor Green
$clickupHeaders = @{"Authorization" = $env:CLICKUP_API_TOKEN}
$clickupResponse = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/team" -Headers $clickupHeaders -ErrorAction SilentlyContinue
if ($clickupResponse) {
    Write-Host "   ✓ ClickUp: Connected to '$($clickupResponse.teams[0].name)'" -ForegroundColor Green
} else {
    Write-Host "   ✗ ClickUp: Failed" -ForegroundColor Red
}

# Test Slack API
Write-Host "`n⚠️  Testing Slack..." -ForegroundColor Yellow
$slackHeaders = @{"Authorization" = "Bearer your-slack-token"}
$slackResponse = Invoke-RestMethod -Uri "https://slack.com/api/auth.test" -Headers $slackHeaders -ErrorAction SilentlyContinue
if ($slackResponse.ok) {
    Write-Host "   ✓ Slack: Connected as '$($slackResponse.user)'" -ForegroundColor Green
} else {
    Write-Host "   ✗ Slack: Failed" -ForegroundColor Red
}

# Check MCP Config
Write-Host "`n🔧 Checking MCP Config..." -ForegroundColor Blue
if (Test-Path ".cursor/mcp.json") {
    Write-Host "   ✓ MCP Config: Found" -ForegroundColor Green
} else {
    Write-Host "   ✗ MCP Config: Missing" -ForegroundColor Red
}

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "   • ClickUp: Use mcp_clickup_* tools" -ForegroundColor White
Write-Host "   • Slack: Try mcp_slack_* first, fallback to API" -ForegroundColor White
Write-Host "   • List ID: 900501824745 | Channel: C02GDJUE8LW" -ForegroundColor White
Write-Host "`n🎯 Ready for automation!" -ForegroundColor Green 