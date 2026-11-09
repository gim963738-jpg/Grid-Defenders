@echo off
setlocal
cd /d "%~dp0"
title Grid Defenders Effect Workshop
powershell.exe -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5182/effect-workshop.html' -TimeoutSec 2; if ($response.StatusCode -eq 200 -and $response.Content.Contains('effect-workshop/main.ts')) { exit 0 } } catch {}; exit 1"
if not errorlevel 1 (
  start "" "http://127.0.0.1:5182/effect-workshop.html"
  exit /b 0
)
if not exist "node_modules\vite\bin\vite.js" (
  call npm.cmd ci --no-audit --no-fund
  if errorlevel 1 (
    echo Dependency installation failed. Check Node.js and your connection.
    pause
    exit /b 1
  )
)
call npm.cmd run workshop
pause
