@echo off
title Hubooze — Push Fix to GitHub
color 0A
echo.
echo  ==========================================
echo    Pushing login fix to GitHub...
echo  ==========================================
echo.

git add backend/server.js
git add backend/middleware/index.js
git add public/index.html
git add public/js/app.js
git commit -m "fix: resolve Host not in allowlist login error"
git push

echo.
echo  ==========================================
echo    Done! Render will redeploy in 2-3 min.
echo    Then test: hubooze.onrender.com/api/health
echo  ==========================================
pause
