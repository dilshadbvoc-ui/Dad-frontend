#!/bin/bash
set -e

echo "🚀 Starting Deployment..."

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 1. Update Backend (Self)
echo "📥 Updating Backend..."
BACKEND_DIR=$(git rev-parse --show-toplevel)
cd "$BACKEND_DIR"

# Clean up stale locks
if [ -f .git/index.lock ]; then
    echo "🧹 Removing stale git lock..."
    rm -f .git/index.lock
fi

git fetch origin main
git reset --hard origin/main
npm install --ignore-scripts
echo "🗄️ Running Migrations..."
npx prisma db push --accept-data-loss
npx prisma generate
echo "🏗️ Building Backend..."
NODE_OPTIONS=--max-old-space-size=768 npm run build
node copy-prisma.js

pm2 restart crm-api || pm2 start dist/index.js --name "crm-api" -- update-env

# 2. Update Frontend (Sibling Directory)
# Assumes frontend is cloned as a sibling folder named 'frontend' or 'client'
CLIENT_DIR="$BACKEND_DIR/../frontend" 
if [ ! -d "$CLIENT_DIR" ]; then
    CLIENT_DIR="$BACKEND_DIR/../client"
fi

if [ -d "$CLIENT_DIR" ]; then
    echo "📥 Updating Frontend in $CLIENT_DIR..."
    cd "$CLIENT_DIR"
    
    # Clean up stale locks
    if [ -f .git/index.lock ]; then
        echo "🧹 Removing stale git lock for frontend..."
        rm -f .git/index.lock
    fi

    git fetch origin main
    git reset --hard origin/main
    npm install
    echo "🏗️ Building Frontend..."
    NODE_OPTIONS=--max-old-space-size=1024 npm run build
    
    # Deploy to Nginx
    echo "📂 Deploying Static Files..."
    sudo mkdir -p /var/www/crm-client
    sudo rm -rf /var/www/crm-client/*
    sudo cp -r dist/* /var/www/crm-client/
else
    echo "⚠️ Frontend directory not found as sibling! Skipping frontend build."
fi

echo "✅ Deployment Complete!"
