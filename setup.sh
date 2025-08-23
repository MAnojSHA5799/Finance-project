#!/bin/bash

# Personal Finance Tracker Setup Script
# This script will help you set up the entire application

set -e

echo "🚀 Personal Finance Tracker Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 12 or higher."
    exit 1
fi

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "❌ Redis is not installed. Please install Redis 6 or higher."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create database
echo "📊 Setting up database..."
createdb finance_tracker 2>/dev/null || echo "Database already exists"

# Backend setup
echo "🔧 Setting up backend..."
cd backend

# Install dependencies
npm install

# Create environment file if it doesn't exist
if [ ! -f config.env ]; then
    echo "📝 Creating environment file..."
    cat > config.env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_tracker
DB_USER=postgres
DB_PASSWORD=password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000
EOF
    echo "✅ Environment file created"
else
    echo "✅ Environment file already exists"
fi

# Run database schema
echo "🗄️ Setting up database schema..."
psql -d finance_tracker -f config/schema.sql

cd ..

# Frontend setup
echo "🎨 Setting up frontend..."
cd frontend

# Install dependencies
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating frontend environment file..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    echo "✅ Frontend environment file created"
else
    echo "✅ Frontend environment file already exists"
fi

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start PostgreSQL: brew services start postgresql (macOS) or sudo systemctl start postgresql (Linux)"
echo "2. Start Redis: brew services start redis (macOS) or sudo systemctl start redis (Linux)"
echo "3. Start the backend: cd backend && npm run dev"
echo "4. Start the frontend: cd frontend && npm start"
echo ""
echo "The application will be available at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:5000"
echo ""
echo "Demo accounts:"
echo "- Admin: admin@demo.com / admin123"
echo "- User: user@demo.com / user123"
echo "- Read-only: readonly@demo.com / readonly123"
echo ""
echo "Happy coding! 🚀"
