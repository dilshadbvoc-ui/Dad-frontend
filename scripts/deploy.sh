#!/bin/bash
set -e

echo "🚀 Starting Deployment..."

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 1. Update Backend (Self)
echo "📥 Updating Backend..."
# Assuming script is run from project root or server dir
# We use 'git rev-parse --show-toplevel' to find root of backend repo
BACKEND_DIR=$(git rev-parse --show-toplevel)
cd "$BACKEND_DIR"
git pull origin main
npm install
echo "🗄️ Running Migrations..."
npx prisma db push --accept-data-loss
npx prisma generate
echo "🏗️ Building Backend..."
npm run build
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
    git pull origin main
    npm install
    echo "🏗️ Building Frontend..."
    npm run build
    
    # Deploy to Nginx
    echo "📂 Deploying Static Files..."
    sudo mkdir -p /var/www/crm-client
    sudo rm -rf /var/www/crm-client/*
    sudo cp -r dist/* /var/www/crm-client/
else
    echo "⚠️ Frontend directory not found as sibling! Skipping frontend build."
fi

echo "✅ Deployment Complete!"
