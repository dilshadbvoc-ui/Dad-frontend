#!/bin/bash
set -e

echo "🚀 Starting Deployment..."

# Load NVM environment if present (common on EC2)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 1. Pull latest code (Assumes repo is cloned in ~/MERN-CRM or similar, user acts on root)
# We assume the user clones the repo into a folder, e.g., 'app' or 'mern-crm'.
# For this script to be generic, we assume it's run from the project root.

echo "📥 Pulling latest code..."
git pull origin main

# 2. Server Setup
echo "🔧 Setting up Server..."
cd server
npm install
# Initial Prisma setup/migration
# Use --accept-data-loss for potentially destructive schema changes in dev/staging
echo "🗄️ Running Database Migrations..."
npx prisma db push --accept-data-loss
npx prisma generate
echo "🏗️ Building Server..."
npm run build

# Restart PM2 process
# We assume the process is named 'crm-api'. If not running, start it.
if pm2 list | grep -q "crm-api"; then
    echo "🔄 Restarting Server (PM2)..."
    pm2 restart crm-api
else
    echo "▶️ Starting Server (PM2)..."
    pm2 start dist/index.js --name "crm-api"
    pm2 save
fi

# 3. Client Setup
echo "🎨 Setting up Client..."
cd ../client
npm install
echo "🏗️ Building Client..."
npm run build

# 4. Deploy Static Files to Nginx
# Assumes Nginx serves from /var/www/crm-client
echo "📂 Deploying Static Files to /var/www/crm-client..."
# Ensure directory exists
sudo mkdir -p /var/www/crm-client
# Remove old files (optional, but safer to keep clean)
sudo rm -rf /var/www/crm-client/*
# Copy new build
sudo cp -r dist/* /var/www/crm-client/

echo "✅ Deployment Complete!"
