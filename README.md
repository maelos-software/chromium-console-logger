# Chromium Console Logger

A standalone local developer tool that connects to Chromium-based browsers (Vivaldi, Chrome, Brave, Edge) via the Chrome DevTools Protocol (CDP) to capture JavaScript console events and uncaught exceptions, streaming them to local NDJSON files with automatic reconnection and log rotation capabilities.

## Features

- 🔌 **CDP Integration**: Connects to any Chromium-based browser via Chrome DevTools Protocol
- 📝 **NDJSON Logging**: Streams events to newline-delimited JSON files for easy parsing
- 🔄 **Auto-Reconnection**: Automatically reconnects when the browser restarts with exponential backoff
- 📊 **Event Capture**: Captures all console methods (log, info, warn, error, debug, trace) and uncaught exceptions
- 🎯 **Flexible Filtering**: Filter events by type, level, and target URL
- 🔁 **Log Rotation**: Automatic log file rotation based on size with configurable retention
- 🛠️ **CLI Interface**: Simple command-line interface with extensive configuration options

## Installation

### Option 1: Install Globally (Recommended)

```bash
npm install -g chromium-console-logger
```

Then use it anywhere:

```bash
chromium-console-logger --tui
```

### Option 2: Use with npx (No Installation)

```bash
npx chromium-console-logger --tui
```

### Option 3: Install Locally in Project

```bash
npm install chromium-console-logger
npx chromium-console-logger --tui
```

### Option 4: Install from Source

```bash
git clone https://github.com/yourusername/chromium-console-logger.git
cd chromium-console-logger
npm install
npm run build
npm install -g .
```

## Quick Start

### 1. Launch Browser with CDP Enabled

Launch your Chromium-based browser with remote debugging enabled:

**Vivaldi:**
```bash
/Applications/Vivaldi.app/Contents/MacOS/Vivaldi --remote-debugging-port=9222
```

**Chrome:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

**Brave:**
```bash
/Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser --remote-debugging-port=9222
```

**Edge:**
```bash
/Applications/Microsoft\ Edge.app/Contents/MacOS/Microsoft\ Edge --remote-debugging-port=9222
```

### 2. Start the Capture Tool

```bash
npx chromium-console-logger
```

The tool will connect to your browser and start capturing console events to `browser-console.ndjson` in the current directory.

## Usage

### Basic Usage

```bash
# Start with Terminal UI (recommended)
chromium-console-logger --tui

# List all available browser tabs
chromium-console-logger --list-tabs

# Monitor only specific tabs (by index)
chromium-console-logger --tabs 1,3,4

# Headless mode with default settings
chromium-console-logger

# Enable verbose logging
chromium-console-logger --verbose

# Specify custom log file
chromium-console-logger --log-file logs/console.ndjson

# Filter by console level
chromium-console-logger --level error --level warn

# Connect to custom host/port
chromium-console-logger --host 192.168.1.100 --port 9223

# Filter by target URL
chromium-console-logger --target-url-substring myapp

# Combine TUI with filters and specific tabs
chromium-console-logger --tui --tabs 2,3 --level error --level warn
```

### Tab Management

**List Available Tabs:**
```bash
chromium-console-logger --list-tabs
```

This will display all open browser tabs with their indices, titles, URLs, and IDs:
```
Found 4 browser tab(s):

[1] Breaking News, Latest News and Videos | CNN
    URL: https://www.cnn.com/
    ID:  686F8C3B6916D48FD7C8E1386FA80481

[2] GitHub Repository
    URL: https://github.com/user/repo
    ID:  340D008EED3D48A570FADB53D3E45CC4
...
```

**Monitor Specific Tabs:**
```bash
# Monitor only tabs 1 and 3
chromium-console-logger --tabs 1,3

# Use with TUI for interactive monitoring
chromium-console-logger --tui --tabs 2,4
```

### Terminal UI (TUI) Controls

When running with `--tui`, you have access to interactive controls:

| Key | Action |
|-----|--------|
| `q` | Quit the application |
| `p` | Pause/Resume event capture |
| `c` | Clear the events display |
| `t` | Toggle Tab Navigation mode |
| `a` | Show all tabs (remove filter) |
| `1-9` | Quickly select tab by number |
| `↑↓` | Navigate tabs (in Tab Nav mode) or scroll events |
| `Enter` | Confirm tab selection (in Tab Nav mode) |

**Tab Navigation Mode:**
- Press `t` to enter Tab Navigation mode (border turns yellow)
- Use arrow keys to highlight different tabs
- Press `Enter` to select the highlighted tab
- The selected tab will be highlighted in cyan
- Press `t` again to return to Events mode

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--host <string>` | CDP host address | `127.0.0.1` |
| `--port <number>` | CDP port number | `9222` |
| `--log-file <path>` | Path to log file | `browser-console.ndjson` |
| `--include-console <boolean>` | Include console events | `true` |
| `--include-exceptions <boolean>` | Include exception events | `true` |
| `--level <string...>` | Console levels to capture (can specify multiple) | `[]` (all) |
| `--verbose` | Enable verbose logging | `false` |
| `--tui` | Enable Terminal UI mode | `false` |
| `--list-tabs` | List all available browser tabs and exit | `false` |
| `--tabs <numbers>` | Monitor only specific tabs by index (comma-separated) | - |
| `--target-url-substring <string>` | Filter targets by URL substring | - |
| `--max-size-bytes <number>` | Maximum log file size before rotation | `Infinity` |
| `--rotate-keep <number>` | Number of rotated files to keep | `5` |

### Examples

**List available tabs:**
```bash
chromium-console-logger --list-tabs
```

**Monitor specific tabs only:**
```bash
# Monitor tabs 1, 2, and 4
chromium-console-logger --tabs 1,2,4
```

**Capture only errors and warnings:**
```bash
chromium-console-logger --level error --level warn
```

**Enable log rotation at 10MB:**
```bash
chromium-console-logger --max-size-bytes 10000000 --rotate-keep 10
```

**Capture only exceptions:**
```bash
chromium-console-logger --include-console false
```

**Filter by target URL:**
```bash
chromium-console-logger --target-url-substring localhost:3000
```

**Monitor specific tabs with TUI:**
```bash
chromium-console-logger --tui --tabs 2,3 --level error
```

**Full configuration example:**
```bash
chromium-console-logger \
  --host 127.0.0.1 \
  --port 9222 \
  --log-file logs/app-console.ndjson \
  --tabs 1,3 \
  --level error --level warn \
  --verbose \
  --target-url-substring myapp \
  --max-size-bytes 5000000 \
  --rotate-keep 5
```

## NDJSON Output Format

Each line in the log file is a valid JSON object representing a captured event.

### Console Event Example

```json
{
  "ts": 1701234567890,
  "event": "console",
  "type": "log",
  "url": "http://localhost:3000/app.js",
  "args": ["User logged in", {"userId": 123}],
  "stackTrace": {
    "callFrames": [
      {
        "functionName": "login",
        "url": "http://localhost:3000/app.js",
        "lineNumber": 42,
        "columnNumber": 10
      }
    ]
  }
}
```

### Exception Event Example

```json
{
  "ts": 1701234567892,
  "event": "exception",
  "type": "exception",
  "url": "http://localhost:3000/app.js",
  "stackTrace": {
    "callFrames": [
      {
        "functionName": "processData",
        "url": "http://localhost:3000/app.js",
        "lineNumber": 156,
        "columnNumber": 15
      }
    ]
  },
  "exceptionDetails": {
    "text": "Uncaught",
    "exception": {
      "type": "object",
      "subtype": "error",
      "className": "Error",
      "description": "Error: Invalid data format"
    }
  }
}
```

### Event Fields

| Field | Type | Description |
|-------|------|-------------|
| `ts` | number | Timestamp in epoch milliseconds |
| `event` | string | Event category: `"console"` or `"exception"` |
| `type` | string | Event type: `"log"`, `"warn"`, `"error"`, `"info"`, `"debug"`, `"trace"`, or `"exception"` |
| `url` | string | Source URL where the event occurred |
| `args` | array | Console arguments (console events only) |
| `stackTrace` | object | CDP StackTrace object (when available) |
| `exceptionDetails` | object | Full exception details (exception events only) |

## Log Rotation

When `--max-size-bytes` is specified, the tool automatically rotates log files:

1. When the current log file exceeds the size threshold, it's renamed to `<filename>.1`
2. Existing rotated files are shifted: `.1` → `.2`, `.2` → `.3`, etc.
3. Files beyond the `--rotate-keep` limit are deleted
4. A new log file is created

Example with `--rotate-keep 3`:
```
browser-console.ndjson      (current)
browser-console.ndjson.1    (most recent rotation)
browser-console.ndjson.2
browser-console.ndjson.3    (oldest, will be deleted on next rotation)
```

## Reconnection Behavior

The tool implements robust reconnection logic:

- **Exponential Backoff**: Retries with increasing delays (100ms, 200ms, 400ms, 800ms, ...)
- **Maximum Delay**: Caps at 5 seconds between attempts
- **Jitter**: Adds ±20% random variation to prevent thundering herd
- **Continuous Retry**: Never gives up unless you send SIGINT (Ctrl+C)
- **Target Reattachment**: Automatically reattaches if the target closes

## Graceful Shutdown

Press `Ctrl+C` to gracefully shut down the tool:

1. Flushes all buffered log data to disk
2. Closes the log file handle cleanly
3. Disconnects from CDP
4. Exits with status code 0

## Troubleshooting

### "Failed to connect to CDP"

**Problem**: The tool can't connect to the browser.

**Solutions**:
- Ensure the browser is running with `--remote-debugging-port=9222`
- Check that no other process is using port 9222
- Verify the host and port with `--host` and `--port` flags
- Use `--verbose` to see detailed connection attempts

### "No suitable target found"

**Problem**: The tool can't find a page target to attach to.

**Solutions**:
- Open at least one tab in the browser
- Check if `--target-url-substring` is too restrictive
- Use `--verbose` to see available targets

### "Error writing to log file"

**Problem**: The tool can't write to the log file.

**Solutions**:
- Check file permissions in the target directory
- Ensure sufficient disk space
- Verify the path with `--log-file` is valid

### Events Not Being Captured

**Problem**: Console events or exceptions aren't appearing in the log.

**Solutions**:
- Check filter settings (`--include-console`, `--include-exceptions`, `--level`)
- Verify the target URL matches with `--target-url-substring`
- Use `--verbose` to see if events are being received
- Ensure the browser tab is active and not paused in debugger

### Log File Growing Too Large

**Problem**: The log file is consuming too much disk space.

**Solutions**:
- Enable log rotation with `--max-size-bytes`
- Adjust `--rotate-keep` to control retention
- Use level filtering to reduce event volume
- Filter by target URL to capture only relevant pages

## Development

### Build from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/chromium-console-logger.git
cd chromium-console-logger

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run locally
node dist/index.js
```

### Project Structure

```
chromium-console-logger/
├── src/
│   ├── index.ts          # CLI entry point
│   ├── cdpClient.ts      # CDP connection and event handling
│   ├── logWriter.ts      # NDJSON file writing and rotation
│   ├── types.ts          # TypeScript type definitions
│   ├── util.ts           # Utility functions
│   └── *.test.ts         # Test files
├── bin/
│   └── chromium-console-logger  # Executable script
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
