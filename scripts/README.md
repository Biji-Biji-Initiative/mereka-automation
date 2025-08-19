# Scripts Directory Organization 📁

This directory contains automation scripts organized by function to maintain a clean, scalable structure.

## Directory Structure

### 🔧 `/mcp/` - MCP Server Management
Scripts for managing Model Context Protocol servers and integrations:
- `setup-mcp-global.ps1` - Global MCP server installation
- `setup-mcp.ps1` - Local MCP setup
- `restart-mcp.ps1` - Restart MCP servers
- `verify-mcp-availability.js` - Check MCP tool availability
- `verify-mcp-tools.ps1` - PowerShell MCP verification
- `check-mcp-status.js` - Check MCP server status
- `mcp-task-creation.js` - Task creation via MCP tools
- `use-mcp-tools.js` - General MCP tool usage

### 🧪 `/api-testing/` - API Integration Testing
Scripts for testing external API integrations:
- `test-clickup-*.ps1` - ClickUp API testing scripts
- `test-slack-connection.js` - Slack API connectivity tests
- `direct-clickup-api.ps1` - Direct ClickUp API calls
- `create-clickup-task-no-slack.js` - ClickUp task creation
- `send-slack-update.js` - Slack messaging functionality
- `clickup-mcp-server.js` - ClickUp MCP server testing

### 🎯 `/testing/` - General Test Automation
Core testing and test execution scripts:
- `run-tests.ps1` / `run-tests.sh` - Main test runners
- `run-automated-tests.ps1` - Automated test execution
- `test-live.ps1` - Live environment testing

### 🎭 `/stagehand/` - Stagehand AI Integration
Scripts for Stagehand AI automation framework:
- `run-stagehand-demo.ps1` - Stagehand demonstration
- `run-stagehand-login.ps1` - Stagehand login automation
- `update-stagehand-config.ps1` - Configuration management

### ⏰ `/daily-automation/` - Scheduled Operations
Scripts for daily and scheduled automation:
- `daily-test-scheduler.ps1` - Daily test scheduling
- `daily-job-creation-test.ps1` - Daily job creation tests
- `simple-daily-test.ps1` - Simple daily health checks

### 📋 Root Level - General Workflow Scripts
General-purpose scripts that don't fit specific categories:
- `check-workflows.ps1` - Workflow verification
- `create-complete-prd.js` - PRD generation
- `create-test-task-and-notify.ps1` - Task creation with notifications
- `search-job-tasks-api.ps1` - Job search via API
- `search-job-tasks-simple.ps1` - Simple job search
- `search-job-tasks.ps1` - Advanced job search
- `README.md` - This documentation file

## Usage Guidelines

### 🔍 Finding Scripts
- **MCP Issues**: Check `/mcp/` directory
- **API Problems**: Look in `/api-testing/`
- **Test Execution**: Use scripts in `/testing/`
- **Daily Automation**: Find schedulers in `/daily-automation/`
- **AI Automation**: Stagehand tools in `/stagehand/`

### 🚀 Common Operations
```powershell
# Setup MCP servers
./mcp/setup-mcp-global.ps1

# Run main tests
./testing/run-tests.ps1

# Test API connectivity
./api-testing/test-clickup-clean.ps1
./api-testing/test-slack-connection.js

# Schedule daily automation
./daily-automation/daily-test-scheduler.ps1
```

### 📝 Adding New Scripts

When adding new scripts, place them in the appropriate directory:
- **MCP-related** → `/mcp/`
- **API testing** → `/api-testing/`
- **General testing** → `/testing/`
- **Stagehand automation** → `/stagehand/`
- **Scheduled tasks** → `/daily-automation/`
- **Workflow scripts** → Root level

## Maintenance Notes

- Scripts are organized by **function** rather than technology
- Each subdirectory contains related functionality
- Root level contains cross-cutting workflow scripts
- Follow naming conventions: `kebab-case.extension`

Last organized: 2025-07-28 