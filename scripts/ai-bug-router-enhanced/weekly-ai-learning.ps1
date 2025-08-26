# Weekly AI Learning Automation
# Runs training analysis and applies improvements automatically

Write-Host "🧠 Weekly AI Learning System" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

try {
    Write-Host "📊 Step 1: Running training data analysis..." -ForegroundColor Yellow
    
    # Set environment variables
    $env:CLICKUP_TOKEN = "pk_66733245_76BVBTVC88U8QUMWSOAW9FDRTXZ28H15"
    
    # Run training analysis
    $analysisResult = node training-data-analyzer.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Training analysis completed successfully" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "🔧 Step 2: Applying improvements..." -ForegroundColor Yellow
        
        # Apply improvements  
        $improvementResult = node apply-training-improvements.js
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ AI improvements applied successfully" -ForegroundColor Green
            
            Write-Host ""
            Write-Host "🎉 Weekly AI Learning Complete!" -ForegroundColor Green
            Write-Host "=================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "📋 What happened this week:" -ForegroundColor Cyan
            Write-Host "  ✅ Analyzed all training examples from ClickUp"
            Write-Host "  ✅ Identified common AI classification mistakes"  
            Write-Host "  ✅ Generated improved classification prompts"
            Write-Host "  ✅ Applied improvements to the system"
            Write-Host "  ✅ Created backup of previous system"
            Write-Host "  ✅ Tested improvements with known examples"
            Write-Host ""
            Write-Host "📈 Your AI is now smarter and more accurate!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🔄 Next Week:" -ForegroundColor Yellow
            Write-Host "  • Keep adding 🤖 emoji reactions to misclassified messages"
            Write-Host "  • This script will run again automatically"
            Write-Host "  • AI will continue learning from your feedback"
            Write-Host ""
        } else {
            Write-Host "❌ Failed to apply improvements (exit code: $LASTEXITCODE)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Training analysis failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error during weekly learning: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🤖 Remember: Your AI learns every time you use the 🤖 emoji!" -ForegroundColor Cyan
