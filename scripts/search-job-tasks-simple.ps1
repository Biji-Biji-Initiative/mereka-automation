# ClickUp Job Tasks Search
# Searches for all tasks with "Job" in the title

Write-Host "Searching ClickUp for tasks with 'Job' in title..." -ForegroundColor Cyan

# Set up API headers
$headers = @{
    "Authorization" = "pk_66733245_76BVBTVC88U8QUMWSOAW9FDRTXZ28H15"
    "Content-Type" = "application/json"
}

try {
    # Get workspace information
    Write-Host "Getting workspace information..." -ForegroundColor Yellow
    $workspaceResponse = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/team/2627356" -Method GET -Headers $headers
    Write-Host "Workspace: $($workspaceResponse.team.name)" -ForegroundColor Green

    # Get spaces in the workspace  
    Write-Host "Getting spaces..." -ForegroundColor Yellow
    $spacesResponse = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/team/2627356/space" -Method GET -Headers $headers
    Write-Host "Found $($spacesResponse.spaces.Count) spaces" -ForegroundColor Green

    # Search for tasks with "Job" in title
    Write-Host "Searching for tasks with 'Job' in title..." -ForegroundColor Yellow
    $jobTasks = @()
    
    foreach ($space in $spacesResponse.spaces) {
        Write-Host "Checking space: $($space.name)" -ForegroundColor Gray
        
        try {
            # Get tasks from space
            $tasksResponse = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/space/$($space.id)/task?include_closed=true" -Method GET -Headers $headers -TimeoutSec 10
            
            # Filter tasks with "Job" in title (case-insensitive)
            $jobTasksInSpace = $tasksResponse.tasks | Where-Object { $_.name -match "(?i)job" }
            
            if ($jobTasksInSpace.Count -gt 0) {
                $jobTasks += $jobTasksInSpace
                Write-Host "Found $($jobTasksInSpace.Count) tasks in this space" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "Error accessing space: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # Display results
    Write-Host "" 
    Write-Host "RESULTS: Found $($jobTasks.Count) tasks with 'Job' in title" -ForegroundColor Cyan
    Write-Host ""

    if ($jobTasks.Count -gt 0) {
        Write-Host "Task Details:" -ForegroundColor Yellow
        $counter = 1
        foreach ($task in $jobTasks) {
            $status = if ($task.status) { $task.status.status } else { "No Status" }
            
            Write-Host "$counter. $($task.name)" -ForegroundColor White
            Write-Host "   Status: $status" -ForegroundColor Gray
            Write-Host "   ID: $($task.id)" -ForegroundColor Gray
            Write-Host ""
            $counter++
        }
    } else {
        Write-Host "No tasks found with 'Job' in the title." -ForegroundColor Yellow
    }

    Write-Host "Search completed successfully!" -ForegroundColor Green

} catch {
    Write-Host "Error accessing ClickUp API:" -ForegroundColor Red
    Write-Host "$($_.Exception.Message)" -ForegroundColor Red
} 