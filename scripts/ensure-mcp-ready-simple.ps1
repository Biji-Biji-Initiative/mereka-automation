# Ensure MCP Tools are Ready for Cursor
# Run this before opening Cursor for guaranteed MCP availability

Write-Host "Preparing MCP Environment..." -ForegroundColor Cyan

# Set environment variables
$env:CLICKUP_API_TOKEN="YOUR_CLICKUP_API_TOKEN_HERE"
$env:CLICKUP_TEAM_ID="2627356"
$env:SLACK_MCP_XOXP_TOKEN="YOUR_SLACK_USER_TOKEN_HERE"
$env:SLACK_TEAM_ID="bijimereka"

Write-Host "Environment variables set" -ForegroundColor Green

# Kill any existing MCP processes to avoid conflicts
Write-Host "Cleaning up existing MCP processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*mcp*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Test if packages are available
Write-Host "Testing ClickUp MCP server availability..." -ForegroundColor Cyan
try {
    $null = npx -y clickup-mcp-server --help 2>$null
    Write-Host "ClickUp MCP server ready" -ForegroundColor Green
} catch {
    Write-Host "ClickUp MCP server installation check failed" -ForegroundColor Red
}

Write-Host "Testing Slack MCP server availability..." -ForegroundColor Cyan
try {
    $null = npx -y slack-mcp-server --help 2>$null
    Write-Host "Slack MCP server ready" -ForegroundColor Green
} catch {
    Write-Host "Slack MCP server installation check failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "MCP Environment Ready! You can now open Cursor." -ForegroundColor Green
Write-Host "IMPORTANT: Wait 5-10 seconds after opening Cursor before starting a new chat." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Close Cursor completely if it's open"
Write-Host "2. Wait 10 seconds"  
Write-Host "3. Open Cursor"
Write-Host "4. Wait 10 seconds before starting new chat"
Write-Host "5. Test MCP tools in first message" 