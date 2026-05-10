#!/bin/bash
echo "Pushing login fix to GitHub..."
git add backend/server.js
git add backend/middleware/index.js
git add public/index.html
git add public/js/app.js
git commit -m "fix: resolve Host not in allowlist login error"
git push
echo "Done! Wait 2-3 min then test: hubooze.onrender.com/api/health"
