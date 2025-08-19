# ClickUp Job Tasks Search using Search API
Write-Host "Searching ClickUp for tasks with 'Job' in title using Search API..." -ForegroundColor Cyan

# Set up API headers
$headers = @{
    "Authorization" = "YOUR_CLICKUP_API_TOKEN_HERE"
    "Content-Type" = "application/json"
}

try {
    # Get workspace information first
    Write-Host "Getting workspace information..." -ForegroundColor Yellow
    $workspaceResponse = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/team/2627356" -Method GET -Headers $headers
    Write-Host "Workspace: $($workspaceResponse.team.name)" -ForegroundColor Green

    # Try using the search API to find tasks with "Job" in title
    Write-Host "Searching for tasks containing 'Job'..." -ForegroundColor Yellow
    
    # Use ClickUp's search endpoint
    $searchUrl = "https://api.clickup.com/api/v2/team/2627356/task?include_closed=true"
    $allTasks = Invoke-RestMethod -Uri $searchUrl -Method GET -Headers $headers -TimeoutSec 15
    
    Write-Host "Found $($allTasks.tasks.Count) total tasks in workspace" -ForegroundColor Green
    
    # Filter tasks that contain "Job" in the title (case-insensitive)
    $jobTasks = $allTasks.tasks | Where-Object { $_.name -match "(?i)job" }
    
    # Display results
    Write-Host ""
    Write-Host "RESULTS: Found $($jobTasks.Count) tasks with 'Job' in title" -ForegroundColor Cyan
    Write-Host ""

    if ($jobTasks.Count -gt 0) {
        Write-Host "Task Details:" -ForegroundColor Yellow
        $counter = 1
        foreach ($task in $jobTasks) {
            $status = if ($task.status) { $task.status.status } else { "No Status" }
            $listName = if ($task.list) { $task.list.name } else { "Unknown List" }
            
            Write-Host "$counter. $($task.name)" -ForegroundColor White
            Write-Host "   Status: $status" -ForegroundColor Gray
            Write-Host "   List: $listName" -ForegroundColor Gray
            Write-Host "   ID: $($task.id)" -ForegroundColor Gray
            if ($task.url) {
                Write-Host "   URL: $($task.url)" -ForegroundColor Gray
            }
            Write-Host ""
            $counter++
        }
    } else {
        Write-Host "No tasks found with 'Job' in the title." -ForegroundColor Yellow
        Write-Host "Showing first 5 tasks as example:" -ForegroundColor Gray
        $sampleTasks = $allTasks.tasks | Select-Object -First 5
        foreach ($task in $sampleTasks) {
            Write-Host "  - $($task.name)" -ForegroundColor Gray
        }
    }

    Write-Host "Search completed successfully!" -ForegroundColor Green

} catch {
    Write-Host "Error accessing ClickUp API:" -ForegroundColor Red
    Write-Host "$($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Let me try with the main list directly..." -ForegroundColor Yellow
    
    try {
        # Try accessing the main "All bugs" list directly
        $listTasksUrl = "https://api.clickup.com/api/v2/list/900501824745/task?include_closed=true"
        $listTasks = Invoke-RestMethod -Uri $listTasksUrl -Method GET -Headers $headers
        
        Write-Host "Found $($listTasks.tasks.Count) tasks in 'All bugs' list" -ForegroundColor Green
        
        $jobTasksInList = $listTasks.tasks | Where-Object { $_.name -match "(?i)job" }
        Write-Host "Tasks with 'Job' in 'All bugs' list: $($jobTasksInList.Count)" -ForegroundColor Cyan
        
        if ($jobTasksInList.Count -gt 0) {
            foreach ($task in $jobTasksInList) {
                Write-Host "- $($task.name)" -ForegroundColor White
            }
        }
    } catch {
        Write-Host "Also failed to access main list: $($_.Exception.Message)" -ForegroundColor Red
    }
} 