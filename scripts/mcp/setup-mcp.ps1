# MCP Setup Script for Cursor + ClickUp + Slack
# Run this script to set up MCP integration

param(
    [Parameter(Mandatory=$true)]
    [string]$ClickUpToken,
    
    [Parameter(Mandatory=$true)]
    [string]$ClickUpTeamId,
    
    [Parameter(Mandatory=$true)]
    [string]$SlackBotToken,
    
    [Parameter(Mandatory=$true)]
    [string]$SlackTeamId,
    
    [Parameter(Mandatory=$true)]
    [string]$SlackChannelIds
)

Write-Host "🚀 Setting up MCP for Cursor + ClickUp + Slack..." -ForegroundColor Green

# Check if Node.js is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Create Cursor MCP config directory
$cursorConfigPath = "$env:APPDATA\Cursor\User\globalStorage\cursor-mcp"
if (!(Test-Path $cursorConfigPath)) {
    New-Item -ItemType Directory -Path $cursorConfigPath -Force
    Write-Host "📁 Created Cursor MCP config directory" -ForegroundColor Green
}

# Create MCP configuration
$mcpConfig = @{
    mcpServers = @{
        clickup = @{
            command = "npx"
            args = @("-y", "clickup-mcp-server")
            env = @{
                CLICKUP_API_TOKEN = $ClickUpToken
                CLICKUP_TEAM_ID = $ClickUpTeamId
            }
        }
        slack = @{
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-slack")
            env = @{
                SLACK_BOT_TOKEN = $SlackBotToken
                SLACK_TEAM_ID = $SlackTeamId
                SLACK_CHANNEL_IDS = $SlackChannelIds
            }
        }
    }
}

# Write config to file
$configFile = Join-Path $cursorConfigPath "mcp_config.json"
$mcpConfig | ConvertTo-Json -Depth 5 | Set-Content -Path $configFile -Encoding UTF8

Write-Host "✅ MCP configuration created at: $configFile" -ForegroundColor Green

# Create project-specific config as backup
$projectConfigDir = ".cursor"
if (!(Test-Path $projectConfigDir)) {
    New-Item -ItemType Directory -Path $projectConfigDir -Force
}
$mcpConfig | ConvertTo-Json -Depth 5 | Set-Content -Path "$projectConfigDir\mcp_config.json" -Encoding UTF8
Write-Host "✅ Project-specific MCP config created" -ForegroundColor Green

# Install MCP packages globally for faster startup
Write-Host "📦 Installing MCP packages..." -ForegroundColor Yellow
try {
    npm install -g clickup-mcp-server @modelcontextprotocol/server-slack
    Write-Host "✅ MCP packages installed globally" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Global install failed, packages will be installed on first use" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 MCP Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. 🔄 Restart Cursor completely" -ForegroundColor Cyan
Write-Host "2. 🎯 Open Cursor and press Cmd+L (Mac) or Ctrl+L (Windows)" -ForegroundColor Cyan
Write-Host "3. 🤖 Select 'Claude 3.5 Sonnet' as your model" -ForegroundColor Cyan
Write-Host "4. ✅ Test with: 'What tools do you have access to?'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Example commands to try:" -ForegroundColor White
Write-Host "• 'Create a ClickUp task called Test MCP Integration'" -ForegroundColor Gray
Write-Host "• 'Send a message to #general saying MCP is working!'" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 See docs/MCP_SETUP_GUIDE.md for detailed examples and troubleshooting" -ForegroundColor Yellow 