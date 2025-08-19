# Create ClickUp Bug Ticket for Job Application Issue (Simple Version)

$taskName = "[Issue] Job application proposed section not working properly"

$taskDescription = "Description: Issue with job application workflow where users cannot properly access or view their job applications in the proposed section of their dashboard after applying to jobs.`n`nLink to Thread: https://bijimereka.slack.com/archives/C02GDJUE8LW/p1753754814535219`n`nPreconditions:`n- User must be logged in as an expert`n- User must have applied to at least one job`n- User must be on their dashboard`n`nSteps to Reproduce:`n1. Go to any expert account (example: tataxa5948@lewou.com)`n2. Apply to any job`n3. Go back to your dashboard`n4. Click on all job application -> proposed section`n`nExpected Result: The proposed section should display the job applications that the expert has submitted with proper status and details`n`nActual Result: Issue occurs in the proposed section (specific behavior to be documented)`n`nAdditional Notes: The job application and job contract pages should display listings in descending order, with the most recent first."

$headers = @{
    "Authorization" = "YOUR_CLICKUP_API_TOKEN_HERE"
    "Content-Type" = "application/json"
}

$body = @{
    name = $taskName
    description = $taskDescription
    priority = 2
    status = "to do"
} | ConvertTo-Json

try {
    Write-Host "Creating ClickUp task..."
    $response = Invoke-RestMethod -Uri "https://api.clickup.com/api/v2/list/900501824745/task" -Method POST -Headers $headers -Body $body
    Write-Host "ClickUp task created successfully!"
    Write-Host "Task ID: $($response.id)"
    Write-Host "Task URL: $($response.url)"
    
    # Store task info for later use
    Write-Host "TASK_ID=$($response.id)"
    Write-Host "TASK_URL=$($response.url)"
    
} catch {
    Write-Host "Error creating ClickUp task:"
    Write-Host "Error: $($_.Exception.Message)"
    throw
} 