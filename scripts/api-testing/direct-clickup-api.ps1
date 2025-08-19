# Direct ClickUp API Access Script
# Use this when MCP tools are not available

param(
    [Parameter(Mandatory=$true)]
    [string]$Action,
    
    [string]$TaskName,
    [string]$Description,
    [string]$ListId = "900501824745", # Default to "All bugs" list
    [int]$Priority = 3,
    [string]$Status = "to do"
)

$ApiToken = "YOUR_CLICKUP_API_TOKEN_HERE"
$TeamId = "2627356"
$Headers = @{
    "Authorization" = $ApiToken
    "Content-Type" = "application/json"
}

switch ($Action.ToLower()) {
    "create-task" {
        if (-not $TaskName) {
            Write-Host "❌ TaskName is required for create-task action" -ForegroundColor Red
            exit 1
        }
        
        $Body = @{
            name = $TaskName
            description = $Description
            priority = $Priority
            status = $Status
        } | ConvertTo-Json

        try {
            $Response = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/list/$ListId/task" -Method POST -Headers $Headers -Body $Body
            Write-Host "✅ Task created successfully!" -ForegroundColor Green
            Write-Host "📋 Task ID: $($Response.id)" -ForegroundColor Cyan
            Write-Host "🔗 Task URL: $($Response.url)" -ForegroundColor Cyan
            return $Response
        }
        catch {
            Write-Host "❌ Failed to create task: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    "list-workspaces" {
        try {
            $Response = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/team" -Method GET -Headers $Headers
            Write-Host "✅ Workspaces retrieved successfully!" -ForegroundColor Green
            $Response.teams | ForEach-Object { 
                Write-Host "📁 $($_.name) (ID: $($_.id))" -ForegroundColor Cyan 
            }
            return $Response
        }
        catch {
            Write-Host "❌ Failed to get workspaces: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    "list-lists" {
        try {
            $Response = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/team/$TeamId/space" -Method GET -Headers $Headers
            Write-Host "✅ Lists retrieved successfully!" -ForegroundColor Green
            return $Response
        }
        catch {
            Write-Host "❌ Failed to get lists: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    default {
        Write-Host "❌ Invalid action. Available actions: create-task, list-workspaces, list-lists" -ForegroundColor Red
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  .\scripts\direct-clickup-api.ps1 -Action 'create-task' -TaskName '[Issue] Test task' -Description 'Test description'" -ForegroundColor Yellow
        Write-Host "  .\scripts\direct-clickup-api.ps1 -Action 'list-workspaces'" -ForegroundColor Yellow
        Write-Host "  .\scripts\direct-clickup-api.ps1 -Action 'list-lists'" -ForegroundColor Yellow
    }
} 