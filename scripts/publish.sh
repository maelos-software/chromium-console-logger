#!/bin/bash

# Publishing script for vivaldi-console-capture

set -e

echo "🚀 Publishing chromium-console-logger to npm"
echo ""

# Check if logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to npm. Please run: npm login"
    exit 1
fi

echo "✅ Logged in as: $(npm whoami)"
echo ""

# Run tests
echo "🧪 Running tests..."
npm test

# Build
echo "🔨 Building project..."
npm run build

# Check version
VERSION=$(node -p "require('./package.json').version")
echo "📦 Version: $VERSION"
echo ""

# Confirm
read -p "Publish version $VERSION to npm? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Publishing..."
    npm publish
    echo ""
    echo "✅ Published successfully!"
    echo ""
    echo "Install with: npm install -g chromium-console-logger"
else
    echo "❌ Publish cancelled"
    exit 1
fi
