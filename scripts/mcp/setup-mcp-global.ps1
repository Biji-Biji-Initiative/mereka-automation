# MCP Global Setup Script
# This script ensures MCP servers are available globally for all Cursor sessions

Write-Host "🚀 Setting up MCP Tools for Global Availability" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is available
Write-Host "📋 Checking Prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js Version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ NPM Version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ NPM not found. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Installing MCP Servers Globally..." -ForegroundColor Yellow

# Install MCP servers globally
$mcpServers = @(
    "clickup-mcp-server",
    "slack-mcp-server", 
    "@modelcontextprotocol/server-github"
)

foreach ($server in $mcpServers) {
    Write-Host "📦 Installing $server..." -ForegroundColor Cyan
    try {
        npm install -g $server
        Write-Host "✅ $server installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Warning: Could not install $server globally. Will use npx instead." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔍 Verifying MCP Configuration..." -ForegroundColor Yellow

# Check if .cursor/mcp.json exists
$mcpConfigPath = ".cursor\mcp.json"
if (Test-Path $mcpConfigPath) {
    Write-Host "✅ MCP configuration file exists: $mcpConfigPath" -ForegroundColor Green
    
    # Display current configuration
    $config = Get-Content $mcpConfigPath | ConvertFrom-Json
    $serverNames = $config.mcpServers.PSObject.Properties.Name
    Write-Host "✅ Configured MCP servers: $($serverNames -join ', ')" -ForegroundColor Green
} else {
    Write-Host "❌ MCP configuration file not found: $mcpConfigPath" -ForegroundColor Red
    Write-Host "   Creating default configuration..." -ForegroundColor Yellow
    
    # Create .cursor directory if it doesn't exist
    if (!(Test-Path ".cursor")) {
        New-Item -ItemType Directory -Path ".cursor"
    }
    
    # Create default MCP configuration
    $defaultConfig = @{
        mcpServers = @{
            clickup = @{
                command = "npx"
                args = @("-y", "clickup-mcp-server")
                env = @{
                    CLICKUP_API_TOKEN = "YOUR_CLICKUP_TOKEN_HERE"
                    CLICKUP_TEAM_ID = "YOUR_TEAM_ID_HERE"
                }
            }
            slack = @{
                command = "npx"
                args = @("-y", "slack-mcp-server")
                env = @{
                    SLACK_MCP_XOXP_TOKEN = "YOUR_SLACK_TOKEN_HERE"
                    SLACK_TEAM_ID = "YOUR_SLACK_TEAM_ID_HERE"
                }
            }
            github = @{
                command = "npx"
                args = @("-y", "@modelcontextprotocol/server-github")
                env = @{
                    GITHUB_PERSONAL_ACCESS_TOKEN = "YOUR_GITHUB_TOKEN_HERE"
                }
            }
        }
    }
    
    $defaultConfig | ConvertTo-Json -Depth 4 | Set-Content $mcpConfigPath
    Write-Host "✅ Default MCP configuration created. Please update tokens!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🧪 Testing MCP Availability..." -ForegroundColor Yellow
node scripts/verify-mcp-availability.js

Write-Host ""
Write-Host "✅ MCP Setup Complete!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Restart Cursor completely"
Write-Host "2. Open a new chat session"
Write-Host "3. Test MCP tools with: mcp_clickup_get_workspaces({random_string: 'test'})"
Write-Host "4. If tools are still not available, check Cursor Developer Console (F12)"
Write-Host ""
Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
Write-Host "• Wait 10-15 seconds after opening new chat for MCP initialization"
Write-Host "• Try typing 'mcp_' to see if autocomplete shows available tools"
Write-Host "• Check .cursor/mcp.json has correct API tokens"
Write-Host "• Ensure project is opened in Cursor (not just files)"
Write-Host "" 