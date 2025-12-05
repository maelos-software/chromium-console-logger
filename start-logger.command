#!/bin/bash

# Start the Chromium Console Logger
# This script can be double-clicked in Finder to start the logger

cd "$(dirname "$0")"

echo "Starting Chromium Console Logger..."
echo "Press Ctrl+C to stop"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if the tool is installed
if [ ! -f "node_modules/.bin/chromium-console-logger" ] && ! command -v chromium-console-logger &> /dev/null; then
    echo "Installing chromium-console-logger..."
    npm install
    echo ""
fi

# Start the logger with verbose output
if [ -f "node_modules/.bin/chromium-console-logger" ]; then
    ./node_modules/.bin/chromium-console-logger --verbose
elif [ -f "bin/chromium-console-logger" ]; then
    # Running from source
    npm run build
    node dist/index.js --verbose
else
    npx chromium-console-logger --verbose
fi
