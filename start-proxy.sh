#!/bin/bash

# IC Verity Proxy Server Startup Script

echo "🚀 Starting IC Verity Proxy Server..."

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp config.env.example .env
    echo "   Please edit .env file with your desired configuration"
fi

# Set default environment variables if not set
export PROXY_TARGET=${PROXY_TARGET:-"http://localhost:3000"}
export HOST=${HOST:-"::"}
export PORT=${PORT:-8080}
export NODE_ENV=${NODE_ENV:-"development"}

echo "📡 Proxy Target: $PROXY_TARGET"
echo "🌐 Server Host: $HOST"
echo "🌐 Server Port: $PORT"
echo "🔧 Environment: $NODE_ENV"
echo ""

# Start the proxy server
echo "🎯 Starting proxy server..."
bun run start
