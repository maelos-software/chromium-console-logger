#!/bin/bash

# Launch Chromium browser with Chrome DevTools Protocol enabled
# This script can be double-clicked in Finder to launch a Chromium browser with CDP
# Default: Vivaldi (modify paths below for Chrome, Brave, or Edge)

echo "Launching Chromium browser with CDP on port 9222..."
echo "Press Ctrl+C to stop"
echo ""

# Check if Vivaldi is installed (default browser)
if [ ! -d "/Applications/Vivaldi.app" ]; then
    echo "Error: Vivaldi not found at /Applications/Vivaldi.app"
    echo ""
    echo "Please install Vivaldi or modify this script to use another Chromium browser."
    echo ""
    echo "Alternatives:"
    echo "  Chrome: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    echo "  Brave: /Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
    echo "  Edge: /Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Launch Vivaldi with remote debugging enabled
/Applications/Vivaldi.app/Contents/MacOS/Vivaldi \
    --remote-debugging-port=9222 \
    --user-data-dir="$HOME/Library/Application Support/Vivaldi-CDP" \
    > /dev/null 2>&1 &

BROWSER_PID=$!

echo "Browser launched with PID: $BROWSER_PID"
echo "CDP endpoint: http://127.0.0.1:9222"
echo ""
echo "You can now run the console capture tool:"
echo "  npx chromium-console-logger"
echo ""
echo "Press Ctrl+C to stop the browser..."

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping browser...'; kill $BROWSER_PID 2>/dev/null; exit 0" INT TERM

# Keep script running
wait $BROWSER_PID
