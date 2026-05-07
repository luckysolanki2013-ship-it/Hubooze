#!/bin/bash
set -e

echo ""
echo "=========================================="
echo "   HUBOOZE — Automatic Setup Script"
echo "=========================================="
echo ""

# Check Node.js
echo "[1/4] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found!"
    echo "Install it from nodejs.org then run this script again."
    exit 1
fi
echo " OK — Node.js $(node --version) found"

# Install packages
echo ""
echo "[2/4] Installing packages..."
npm install
echo " OK — Packages installed"

# Create .env
echo ""
echo "[3/4] Creating .env file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo " OK — .env created"
else
    echo " OK — .env already exists"
fi

# Open browser and start server
echo ""
echo "[4/4] Starting server..."
echo ""
echo "=========================================="
echo "  Opening http://localhost:3000"
echo "  Press Ctrl+C to stop"
echo "=========================================="
echo ""

# Open browser after 2 seconds in background
(sleep 2 && open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null) &

# Start server
node backend/server.js
