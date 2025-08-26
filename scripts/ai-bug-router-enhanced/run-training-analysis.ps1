# AI Training Data Analysis Runner
# Analyzes ClickUp training examples and generates improvement recommendations

Write-Host "🧠 AI Training Data Analysis" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if training data analyzer exists
if (-not (Test-Path "training-data-analyzer.js")) {
    Write-Host "❌ training-data-analyzer.js not found." -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Running training data analysis..." -ForegroundColor Yellow

try {
    # Run the analysis
    node training-data-analyzer.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Analysis completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 What happened:" -ForegroundColor Cyan
        Write-Host "  1. ✅ Fetched all training examples from ClickUp"
        Write-Host "  2. ✅ Analyzed AI classification patterns" 
        Write-Host "  3. ✅ Identified common mistakes"
        Write-Host "  4. ✅ Generated improvement recommendations"
        Write-Host "  5. ✅ Created detailed analysis report in ClickUp"
        Write-Host ""
        Write-Host "🔄 Next Steps:" -ForegroundColor Yellow
        Write-Host "  • Check your ClickUp 'AI Training Examples' list for the analysis report"
        Write-Host "  • Review the recommendations and common mistakes"
        Write-Host "  • Update your AI prompts based on the findings"
        Write-Host "  • Run this analysis weekly to continuously improve AI accuracy"
        Write-Host ""
        Write-Host "🎯 The AI will learn from human feedback and get better over time!" -ForegroundColor Green
    } else {
        Write-Host "❌ Analysis failed with exit code $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error running analysis: $($_.Exception.Message)" -ForegroundColor Red
}

