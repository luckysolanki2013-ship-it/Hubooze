STEP 1 — Copy ALL these files into your hubooze folder:

  backend/server.js              → hubooze/backend/server.js
  backend/middleware/index.js    → hubooze/backend/middleware/index.js
  public/index.html              → hubooze/public/index.html
  public/js/app.js               → hubooze/public/js/app.js

STEP 2 — Open Command Prompt in your hubooze folder

STEP 3 — Double click push_fix.bat
  OR run: push_fix.bat

STEP 4 — Wait 2-3 minutes

STEP 5 — Open in browser:
  https://hubooze.onrender.com/api/health
  
  You should see: {"status":"ok",...}
  Login will then work.
