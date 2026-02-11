#!/bin/bash

# Start Prisma Studio for database management
# This script starts Prisma Studio on port 5555

echo "🚀 Starting Prisma Studio..."
echo "📊 Database viewer will be available at: http://localhost:5555"
echo ""
echo "⚠️  Important:"
echo "   - Prisma Studio provides direct database access"
echo "   - Changes are immediate and cannot be undone"
echo "   - Only use this for development or with caution in production"
echo ""
echo "Press Ctrl+C to stop Prisma Studio"
echo ""

npx prisma studio --port 5555
