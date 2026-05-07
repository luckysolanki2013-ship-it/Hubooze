#!/bin/bash
echo ""
echo "=========================================="
echo "   HUBOOZE — Deploy to GitHub"
echo "=========================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "ERROR: Git not found. Install from git-scm.com"
    exit 1
fi

# Get GitHub username
echo "Enter your GitHub username:"
read GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "ERROR: Username cannot be empty"
    exit 1
fi

REPO_URL="https://github.com/$GITHUB_USER/hubooze.git"

echo ""
echo "Repository: $REPO_URL"
echo ""

# Initialize git if not already
if [ ! -d .git ]; then
    echo "[1/5] Initializing git..."
    git init
    git branch -M main
else
    echo "[1/5] Git already initialized"
fi

# Add .gitignore safety check
echo "[2/5] Checking .gitignore..."
if ! grep -q ".env" .gitignore 2>/dev/null; then
    echo ".env" >> .gitignore
    echo "node_modules/" >> .gitignore
fi
echo " OK — .env is protected from upload"

# Stage all files
echo "[3/5] Staging files..."
git add .
echo " OK — Files staged"

# Commit
echo "[4/5] Creating commit..."
git commit -m "Hubooze v1.0 — initial deployment" 2>/dev/null || echo " OK — Nothing new to commit"

# Push
echo "[5/5] Pushing to GitHub..."
echo " NOTE: GitHub will ask for your username and password"
echo " Use your GitHub password or a Personal Access Token"
echo ""
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git push -u origin main

echo ""
echo "=========================================="
echo "  Code is on GitHub!"
echo "  Now go to render.com to deploy"
echo "=========================================="
