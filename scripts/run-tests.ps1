# Mereka Automation Test Runner (PowerShell)
# Usage: .\run-tests.ps1 [options]

param(
    [switch]$Headed,
    [string]$Browser = "chromium",
    [string]$Test,
    [switch]$All,
    [switch]$Job,
    [switch]$Collection,
    [switch]$List,
    [switch]$Help
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Function to display usage
function Show-Usage {
    Write-Host "Mereka Automation Test Runner" -ForegroundColor $Blue
    Write-Host ""
    Write-Host "Usage: .\run-tests.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Headed          Run tests in headed mode (show browser)"
    Write-Host "  -Browser         Specify browser (chromium, firefox, webkit)"
    Write-Host "  -Test            Run specific test file"
    Write-Host "  -All             Run all tests"
    Write-Host "  -Job             Run job-related tests"
    Write-Host "  -Collection      Run job collection tests"
    Write-Host "  -List            List all available test files"
    Write-Host "  -Help            Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\run-tests.ps1 -All                    # Run all tests"
    Write-Host "  .\run-tests.ps1 -Headed -All            # Run all tests in headed mode"
    Write-Host "  .\run-tests.ps1 -Test auth/login        # Run specific test"
    Write-Host "  .\run-tests.ps1 -Job -Headed            # Run job tests in headed mode"
    Write-Host "  .\run-tests.ps1 -Collection             # Run job collection tests"
}

# Function to list all test files
function List-Tests {
    Write-Host "Available test files:" -ForegroundColor $Blue
    Write-Host ""
    
    if (Test-Path "mereka-automation") {
        $testFiles = Get-ChildItem -Path "mereka-automation" -Recurse -Filter "*.spec.ts"
        foreach ($file in $testFiles) {
            $relativePath = $file.FullName.Replace("$PWD\mereka-automation\", "")
            Write-Host "  $relativePath" -ForegroundColor $Green
        }
    } else {
        Write-Host "mereka-automation folder not found!" -ForegroundColor $Red
        exit 1
    }
}

# Function to run tests
function Run-Tests {
    param([string]$TestPath)
    
    $command = "npx playwright test"
    
    if ($Headed) {
        $command += " --headed"
    }
    
    if ($Browser -and $Browser -ne "chromium") {
        $command += " --project=$Browser"
    }
    
    if ($TestPath) {
        if ($TestPath.EndsWith("/")) {
            $command += " mereka-automation/$TestPath"
        } else {
            $command += " mereka-automation/$TestPath.spec.ts"
        }
    } else {
        $command += " mereka-automation/"
    }
    
    Write-Host "Running: $command" -ForegroundColor $Blue
    Write-Host ""
    
    Invoke-Expression $command
}

# Main logic
if ($Help) {
    Show-Usage
    exit 0
}

if ($List) {
    List-Tests
    exit 0
}

if ($All) {
    Run-Tests ""
    exit 0
}

if ($Job) {
    Run-Tests "job"
    exit 0
}

if ($Collection) {
    Run-Tests "job/job-collection/"
    exit 0
}

if ($Test) {
    Run-Tests $Test
    exit 0
}

# Default: show usage if no arguments provided
Show-Usage 