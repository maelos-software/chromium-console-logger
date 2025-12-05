#!/bin/bash

# Start the Vivaldi Console Capture logger
# This script can be double-clicked in Finder to start the logger

cd "$(dirname "$0")"

echo "Starting Vivaldi Console Capture..."
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
if [ ! -f "node_modules/.bin/vivaldi-console-capture" ] && ! command -v vivaldi-console-capture &> /dev/null; then
    echo "Installing vivaldi-console-capture..."
    npm install
    echo ""
fi

# Start the logger with verbose output
if [ -f "node_modules/.bin/vivaldi-console-capture" ]; then
    ./node_modules/.bin/vivaldi-console-capture --verbose
elif [ -f "bin/vivaldi-console-capture" ]; then
    # Running from source
    npm run build
    node dist/index.js --verbose
else
    npx vivaldi-console-capture --verbose
fi
