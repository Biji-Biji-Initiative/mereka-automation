# ClickUp Job Tasks Search
# Searches for all tasks with "Job" in the title

Write-Host "🔍 Searching ClickUp for tasks with 'Job' in title..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Set up API headers
$headers = @{
    "Authorization" = "pk_66733245_76BVBTVC88U8QUMWSOAW9FDRTXZ28H15"
    "Content-Type" = "application/json"
}

try {
    # Get workspace information
    Write-Host "`n🏢 Getting workspace information..." -ForegroundColor Yellow
    $workspaceResponse = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/team/2627356" -Method GET -Headers $headers
    Write-Host "   Workspace: $($workspaceResponse.team.name)" -ForegroundColor Green

    # Get spaces in the workspace  
    Write-Host "`n📁 Getting spaces..." -ForegroundColor Yellow
    $spacesResponse = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/team/2627356/space" -Method GET -Headers $headers
    Write-Host "   Found $($spacesResponse.spaces.Count) spaces" -ForegroundColor Green

    # Search for tasks with "Job" in title
    Write-Host "`n🔍 Searching for tasks with 'Job' in title..." -ForegroundColor Yellow
    $jobTasks = @()
    
    foreach ($space in $spacesResponse.spaces) {
        Write-Host "   Checking space: $($space.name)" -ForegroundColor Gray
        
        try {
            # Get tasks from space
            $tasksResponse = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/space/$($space.id)/task?include_closed=true" -Method GET -Headers $headers -TimeoutSec 10
            
            # Filter tasks with "Job" in title (case-insensitive)
            $jobTasksInSpace = $tasksResponse.tasks | Where-Object { $_.name -match "(?i)job" }
            
            if ($jobTasksInSpace.Count -gt 0) {
                $jobTasks += $jobTasksInSpace
                Write-Host "     ✅ Found $($jobTasksInSpace.Count) tasks" -ForegroundColor Green
            } else {
                Write-Host "     ⚪ No tasks found" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "     ❌ Error accessing space: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # Display results
    Write-Host "`n" + "="*50 -ForegroundColor Cyan
    Write-Host "📊 RESULTS: Found $($jobTasks.Count) tasks with 'Job' in title" -ForegroundColor Cyan
    Write-Host "="*50 -ForegroundColor Cyan

    if ($jobTasks.Count -gt 0) {
        Write-Host "`n📝 Task Details:" -ForegroundColor Yellow
        $counter = 1
        foreach ($task in $jobTasks) {
            $status = if ($task.status) { $task.status.status } else { "No Status" }
            $assignees = if ($task.assignees.Count -gt 0) { ($task.assignees | ForEach-Object { $_.username }) -join ", " } else { "Unassigned" }
            
            Write-Host "$counter. 📋 $($task.name)" -ForegroundColor White
            Write-Host "    Status: $status" -ForegroundColor Gray
            Write-Host "    Assigned: $assignees" -ForegroundColor Gray
            Write-Host "    ID: $($task.id)" -ForegroundColor Gray
            Write-Host "" # Empty line
            $counter++
        }
    } else {
        Write-Host "`n🔍 No tasks found with 'Job' in the title." -ForegroundColor Yellow
        Write-Host "   Try checking the ClickUp interface manually or search for different keywords." -ForegroundColor Gray
    }

    Write-Host "`n✅ Search completed successfully!" -ForegroundColor Green

} catch {
    Write-Host "`n❌ Error accessing ClickUp API:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Possible solutions:" -ForegroundColor Yellow
    Write-Host "   • Check API token is valid" -ForegroundColor Gray
    Write-Host "   • Verify workspace ID (2627356)" -ForegroundColor Gray
    Write-Host "   • Check internet connection" -ForegroundColor Gray
} 