@echo off
title Hubooze Setup
color 0A
echo.
echo  ==========================================
echo    HUBOOZE — Automatic Setup Script
echo  ==========================================
echo.

echo [1/4] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install from nodejs.org first.
    pause
    exit /b 1
)
echo  OK — Node.js found

echo.
echo [2/4] Installing packages...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed.
    echo Try: npm cache clean --force  then run setup.bat again
    pause
    exit /b 1
)
echo  OK — Packages installed

echo.
echo [3/4] Creating .env file...
if not exist .env (
    copy .env.example .env
    echo  OK — .env created
) else (
    echo  OK — .env already exists
)

echo.
echo [4/4] Starting server...
echo.
echo  ==========================================
echo    Opening http://localhost:3000
echo    Press Ctrl+C to stop the server
echo  ==========================================
echo.

:: Open browser after 2 seconds
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Start server
node backend/server.js
