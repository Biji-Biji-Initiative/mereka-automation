# Simple ClickUp API Test - List Workspaces (Clean Version)
$ApiToken = "YOUR_CLICKUP_API_TOKEN_HERE"
$Headers = @{
    "Authorization" = $ApiToken
    "Content-Type" = "application/json"
}

try {
    Write-Host "Testing ClickUp connection..." -ForegroundColor Yellow
    $Response = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/team" -Method GET -Headers $Headers
    Write-Host "ClickUp connection successful!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Available Workspaces:" -ForegroundColor Cyan
    $Response.teams | ForEach-Object { 
        Write-Host "   - $($_.name) (ID: $($_.id))" -ForegroundColor White
    }
    
    return $Response
}
catch {
    Write-Host "ClickUp connection failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} 