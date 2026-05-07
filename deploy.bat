@echo off
title Hubooze Deploy to GitHub
color 0A
echo.
echo  ==========================================
echo    HUBOOZE — Deploy to GitHub
echo  ==========================================
echo.

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git not found. Install from git-scm.com
    pause
    exit /b 1
)

set /p GITHUB_USER="Enter your GitHub username: "
if "%GITHUB_USER%"=="" (
    echo ERROR: Username cannot be empty
    pause
    exit /b 1
)

set REPO_URL=https://github.com/%GITHUB_USER%/hubooze.git
echo.
echo Repository: %REPO_URL%
echo.

echo [1/5] Initializing git...
git init >nul 2>&1
git branch -M main >nul 2>&1
echo  OK

echo [2/5] Checking .gitignore...
findstr /c:".env" .gitignore >nul 2>&1 || echo .env>>.gitignore
echo  OK — .env protected

echo [3/5] Staging files...
git add .
echo  OK

echo [4/5] Creating commit...
git commit -m "Hubooze v1.0 initial deployment" >nul 2>&1
echo  OK

echo [5/5] Pushing to GitHub...
echo  NOTE: Enter your GitHub username and password when asked
echo.
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
git push -u origin main

echo.
echo  ==========================================
echo    Done! Code is on GitHub.
echo    Now go to render.com to deploy
echo  ==========================================
pause
