# MCP Restart and Diagnostic Script
Write-Host "🔧 MCP Diagnostic and Restart Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check if MCP config exists
Write-Host "`n📋 Checking MCP Configuration..." -ForegroundColor Yellow
if (Test-Path ".cursor/mcp.json") {
    Write-Host "   ✅ .cursor/mcp.json exists" -ForegroundColor Green
    $mcpConfig = Get-Content ".cursor/mcp.json" | ConvertFrom-Json
    Write-Host "   ✅ Found $($mcpConfig.mcpServers.Keys.Count) MCP servers configured:" -ForegroundColor Green
    foreach ($server in $mcpConfig.mcpServers.Keys) {
        Write-Host "     - $server" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ .cursor/mcp.json not found!" -ForegroundColor Red
    exit 1
}

# Test MCP servers
Write-Host "`n🧪 Testing MCP Servers..." -ForegroundColor Yellow

# Test ClickUp MCP
Write-Host "   Testing ClickUp MCP server..." -ForegroundColor Gray
$env:CLICKUP_API_TOKEN = "pk_66733245_76BVBTVC88U8QUMWSOAW9FDRTXZ28H15"
$env:CLICKUP_TEAM_ID = "2627356"

try {
    $clickupTest = npx clickup-mcp-server --help 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "     ✅ ClickUp MCP server is working" -ForegroundColor Green
    } else {
        Write-Host "     ⚠️  ClickUp MCP server has issues" -ForegroundColor Yellow
    }
} catch {
    Write-Host "     ❌ ClickUp MCP server failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Instructions
Write-Host "`n🔄 Next Steps to Fix MCP:" -ForegroundColor Cyan
Write-Host "1. Close all Cursor windows completely" -ForegroundColor White
Write-Host "2. Restart Cursor" -ForegroundColor White
Write-Host "3. Wait 10-15 seconds for MCP servers to initialize" -ForegroundColor White
Write-Host "4. Start a new chat session" -ForegroundColor White
Write-Host "5. Test with: describe available tools" -ForegroundColor White

Write-Host "`n💡 Alternative Solutions:" -ForegroundColor Cyan
Write-Host "• Check Windows firewall isn't blocking Node.js" -ForegroundColor Gray
Write-Host "• Ensure antivirus isn't interfering with MCP servers" -ForegroundColor Gray
Write-Host "• Try running Cursor as administrator" -ForegroundColor Gray
Write-Host "• Update Node.js to latest version" -ForegroundColor Gray

Write-Host "`n🎯 Expected MCP Tools After Restart:" -ForegroundColor Cyan
Write-Host "• mcp_clickup_create_task" -ForegroundColor Gray
Write-Host "• mcp_clickup_get_workspaces" -ForegroundColor Gray
Write-Host "• mcp_clickup_get_task_details" -ForegroundColor Gray
Write-Host "• mcp_slack_conversations_add_message" -ForegroundColor Gray
Write-Host "• mcp_github_create_issue" -ForegroundColor Gray

Write-Host "`n✅ MCP diagnostic completed!" -ForegroundColor Green 