#!/usr/bin/env pwsh

Write-Host "🚀 Running tests in LIVE environment..." -ForegroundColor Red
$env:TEST_ENV = "live"
npx playwright test --headed
Write-Host "📊 Opening HTML report..." -ForegroundColor Cyan
npx playwright show-report 