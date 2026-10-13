#!/usr/bin/env powershell
# Quick E2E runner - prompts for password securely
# Usage: powershell -ExecutionPolicy Bypass .\run_e2e.ps1

Write-Host "=== SIGAP MBG E2E Test Runner ===" -ForegroundColor Cyan
Write-Host ""

# Check MySQL running
$mysqlRunning = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
if (-not $mysqlRunning) {
    Write-Host "[ERROR] MySQL not running on port 3306" -ForegroundColor Red
    Write-Host "Start with: Start-Process D:\HBB\MYSQL\bin\mysqld.exe -ArgumentList '--console','--bind-address=127.0.0.1','--mysqlx=OFF'" -ForegroundColor Yellow
    exit 1
}

# Check port 3000 free
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "[ERROR] Port 3000 already in use (PID $($port3000.OwningProcess))" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] MySQL running, port 3000 free" -ForegroundColor Green
Write-Host ""

# Get credentials
$env:DB_USER = "sigap"
$securePassword = Read-Host "MySQL password for user 'sigap'" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $securePassword).Password

Write-Host ""
Write-Host "Running E2E test..." -ForegroundColor Cyan
Write-Host ""

try {
    # Run E2E
    powershell -ExecutionPolicy Bypass -File tools\e2e_local.ps1
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "=== E2E PASSED ===" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next: Open browser to http://localhost:3000/overview" -ForegroundColor Cyan
        Write-Host "Backend still running on port 3000 for manual testing" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "=== E2E FAILED ===" -ForegroundColor Red
        exit $exitCode
    }
} finally {
    # Clear sensitive env vars
    Remove-Item Env:DB_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:DB_USER -ErrorAction SilentlyContinue
}
