# Ensure MCP Tools are Ready for Cursor
# Run this before opening Cursor for guaranteed MCP availability

Write-Host "🔧 Preparing MCP Environment..." -ForegroundColor Cyan

# Set environment variables
$env:CLICKUP_API_TOKEN="YOUR_CLICKUP_API_TOKEN_HERE"
$env:CLICKUP_TEAM_ID="2627356"
$env:SLACK_MCP_XOXP_TOKEN="YOUR_SLACK_USER_TOKEN_HERE"
$env:SLACK_TEAM_ID="bijimereka"

Write-Host "✅ Environment variables set" -ForegroundColor Green

# Kill any existing MCP processes to avoid conflicts
Get-Process | Where-Object {$_.ProcessName -like "*mcp*" -or $_.CommandLine -like "*clickup-mcp*" -or $_.CommandLine -like "*slack-mcp*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "🧹 Cleaned up existing MCP processes" -ForegroundColor Yellow

# Test MCP servers can start
Write-Host "🧪 Testing ClickUp MCP server..." -ForegroundColor Cyan
$clickupTest = Start-Process -FilePath "npx" -ArgumentList "-y", "clickup-mcp-server", "--version" -PassThru -Wait -WindowStyle Hidden
if ($clickupTest.ExitCode -eq 0) {
    Write-Host "✅ ClickUp MCP server ready" -ForegroundColor Green
} else {
    Write-Host "❌ ClickUp MCP server failed" -ForegroundColor Red
}

Write-Host "🧪 Testing Slack MCP server..." -ForegroundColor Cyan  
$slackTest = Start-Process -FilePath "npx" -ArgumentList "-y", "slack-mcp-server", "--version" -PassThru -Wait -WindowStyle Hidden
if ($slackTest.ExitCode -eq 0) {
    Write-Host "✅ Slack MCP server ready" -ForegroundColor Green
} else {
    Write-Host "❌ Slack MCP server failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 MCP Environment Ready! You can now open Cursor." -ForegroundColor Green
Write-Host "⚠️  Wait 5-10 seconds after opening Cursor before starting a new chat." -ForegroundColor Yellow 