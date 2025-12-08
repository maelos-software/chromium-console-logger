# Chromium Console Logger

[![npm version](https://img.shields.io/npm/v/chromium-console-logger.svg)](https://www.npmjs.com/package/chromium-console-logger)
[![npm downloads](https://img.shields.io/npm/dm/chromium-console-logger.svg)](https://www.npmjs.com/package/chromium-console-logger)
![CI](https://github.com/maelos-software/chromium-console-logger/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/maelos-software/chromium-console-logger/branch/main/graph/badge.svg)](https://codecov.io/gh/maelos-software/chromium-console-logger)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Capture browser console logs and exceptions from any Chromium browser to local files. Perfect for debugging, LLM-assisted development, and analyzing client-side JavaScript.**

A standalone CLI tool that connects to Chromium-based browsers (Chrome, Vivaldi, Brave, Edge) via the Chrome DevTools Protocol (CDP) to capture JavaScript console events and uncaught exceptions, streaming them to local NDJSON files with automatic reconnection and log rotation.

## Why Use This?

### 🤖 Perfect for LLM-Assisted Development

When coding with AI assistants like Claude, ChatGPT, or Cursor, you no longer need to:

- Take screenshots of browser console errors
- Copy-paste log messages back and forth
- Describe what you're seeing in the console

Instead, your AI coding assistant can **directly read the console logs** from the NDJSON file. This eliminates round trips and lets the AI see exactly what's happening in your browser in real-time.

**Example workflow:**

```bash
# Start capturing console logs
chromium-console-logger --tui

# In your AI chat:
"Check browser-console.ndjson - there's an error when I click the submit button"
```

The AI can now see the exact error, stack trace, and context without you having to manually relay the information.

### 🖥️ Interactive Terminal UI

Monitor your browser console in real-time with a beautiful terminal interface:

- **Live event stream** - See console logs and errors as they happen
- **Tab filtering** - Focus on specific browser tabs
- **Search & filter** - Find specific log messages instantly
- **Keyboard navigation** - Full keyboard control for efficient debugging
- **Pause/resume** - Control the flow of events

### Traditional Development Benefits

- Debug production-like issues locally without browser DevTools open
- Analyze console patterns across multiple tabs and sessions
- Automatic reconnection when browser restarts
- Machine-readable NDJSON format for easy parsing and analysis
- Filter by log level, tab, or URL

## Quick Start

```bash
# Install globally
npm install -g chromium-console-logger

# Launch Chrome with remote debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Start capturing with interactive Terminal UI
chromium-console-logger --tui
```

That's it! All console logs and exceptions from your browser are now being captured to `browser-console.ndjson` and displayed in a beautiful interactive terminal interface.

### Using with AI Coding Assistants

Once running, your AI assistant can read the log file directly:

```
# In your AI chat (Claude, ChatGPT, Cursor, etc.):
"Read browser-console.ndjson and help me debug the authentication error"
```

The AI sees the exact console output, stack traces, and timing - no screenshots or copy-pasting needed!

## Use Cases

### AI-Assisted Development

- **LLM Pair Programming**: Let your AI assistant (Claude, ChatGPT, Cursor) read console logs directly
- **Faster Debugging**: Eliminate screenshot/copy-paste round trips when working with AI
- **Context Sharing**: Give your AI the full browser console context automatically

### Traditional Development

- **Local Development**: Capture logs from multiple tabs without keeping DevTools open
- **Bug Reproduction**: Record console output during bug reproduction steps
- **Performance Analysis**: Analyze console patterns and timing across sessions
- **Automated Testing**: Capture browser logs during E2E test runs
- **Client Debugging**: Monitor production-like scenarios locally

## Features

### Interactive Terminal UI

- **Real-time Monitoring**: Beautiful terminal interface showing live console events
- **Syntax Highlighting**: Color-coded log levels and event types
- **Search & Filter**: Find specific messages instantly with built-in search
- **Tab Management**: Monitor specific browser tabs or switch between them
- **Keyboard Controls**: Full keyboard navigation (pause, clear, filter, search)
- **Live Statistics**: See event counts and connection status at a glance

### Core Capabilities

- **CDP Integration**: Connects to any Chromium-based browser via Chrome DevTools Protocol
- **NDJSON Logging**: Streams events to newline-delimited JSON files for easy parsing
- **AI-Friendly**: Perfect for LLM-assisted development - no more screenshot sharing
- **Auto-Reconnection**: Automatically reconnects when the browser restarts with exponential backoff
- **Event Capture**: Captures all console methods (log, info, warn, error, debug, trace) and uncaught exceptions
- **Flexible Filtering**: Filter events by type, level, and target URL
- **Log Rotation**: Automatic log file rotation based on size with configurable retention

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
git clone https://github.com/maelos-software/chromium-console-logger.git
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

### Terminal UI (TUI) Mode

The interactive Terminal UI provides a powerful, real-time view of your browser console:

**Features:**

- **Live Event Stream**: See console logs, warnings, errors, and exceptions as they happen
- **Color-Coded Events**: Different colors for log levels (info, warn, error, etc.)
- **Tab Filtering**: Monitor specific browser tabs or all tabs at once
- **Search Functionality**: Find specific log messages with `/` search
- **Pause/Resume**: Control the flow of events without stopping capture
- **Event Details**: View full stack traces and exception details
- **Statistics**: Real-time counts of events by type and level

**Keyboard Controls:**

| Key     | Action                                           |
| ------- | ------------------------------------------------ |
| `q`     | Quit the application                             |
| `p`     | Pause/Resume event capture                       |
| `c`     | Clear the events display                         |
| `/`     | Search for specific text in events               |
| `v`     | Toggle verbose mode (show full event details)    |
| `t`     | Toggle Tab Navigation mode                       |
| `a`     | Show all tabs (remove filter)                    |
| `1-9`   | Quickly select tab by number                     |
| `↑↓`    | Navigate tabs (in Tab Nav mode) or scroll events |
| `Enter` | Confirm tab selection (in Tab Nav mode)          |

**Tab Navigation Mode:**

- Press `t` to enter Tab Navigation mode (border turns yellow)
- Use arrow keys to highlight different tabs
- Press `Enter` to select the highlighted tab
- The selected tab will be highlighted in cyan
- Press `t` again to return to Events mode

**Perfect for AI-Assisted Development:**

The TUI makes it easy to spot errors and share context with your AI assistant. When you see an error in the TUI, simply tell your AI to read the log file - it will see the same events you're seeing in real-time.

### CLI Options

| Option                            | Description                                           | Default                  |
| --------------------------------- | ----------------------------------------------------- | ------------------------ |
| `--host <string>`                 | CDP host address                                      | `127.0.0.1`              |
| `--port <number>`                 | CDP port number                                       | `9222`                   |
| `--log-file <path>`               | Path to log file                                      | `browser-console.ndjson` |
| `--include-console <boolean>`     | Include console events                                | `true`                   |
| `--include-exceptions <boolean>`  | Include exception events                              | `true`                   |
| `--level <string...>`             | Console levels to capture (can specify multiple)      | `[]` (all)               |
| `--verbose`                       | Enable verbose logging                                | `false`                  |
| `--tui`                           | Enable Terminal UI mode                               | `false`                  |
| `--list-tabs`                     | List all available browser tabs and exit              | `false`                  |
| `--tabs <numbers>`                | Monitor only specific tabs by index (comma-separated) | -                        |
| `--target-url-substring <string>` | Filter targets by URL substring                       | -                        |
| `--max-size-bytes <number>`       | Maximum log file size before rotation                 | `Infinity`               |
| `--rotate-keep <number>`          | Number of rotated files to keep                       | `5`                      |
| `--stdout`                        | Output logs to stdout instead of file                 | `false`                  |

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

**Output to stdout instead of file:**

```bash
# Stream logs to stdout (useful for piping)
chromium-console-logger --stdout

# Pipe to jq for filtering
chromium-console-logger --stdout | jq 'select(.type == "error")'

# Pipe to grep
chromium-console-logger --stdout | grep "API error"

# Save to custom location
chromium-console-logger --stdout > /tmp/browser-logs.ndjson
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

## Advanced Features

### Stdout Mode

Output logs directly to stdout instead of a file. Perfect for:

- Piping to other tools (jq, grep, awk)
- Integration with log aggregation systems
- Real-time processing
- Custom log destinations

```bash
# Stream to stdout
chromium-console-logger --stdout

# Filter errors with jq
chromium-console-logger --stdout | jq 'select(.type == "error")'

# Search for specific messages
chromium-console-logger --stdout | grep "authentication"

# Count log types
chromium-console-logger --stdout | jq -r '.type' | sort | uniq -c

# Filter logs from a specific tab by title
chromium-console-logger --stdout | jq 'select(.tab.title == "My App - Dashboard")'

# Group errors by tab
chromium-console-logger --stdout | jq -r 'select(.type == "error") | .tab.title' | sort | uniq -c

# Get all unique tab titles
chromium-console-logger --stdout | jq -r '.tab.title' | sort -u

# Filter by tab ID
chromium-console-logger --stdout | jq 'select(.tab.id == "E4E5E5E5E5E5E5E5E5E5E5E5E5E5E5E5")'

# Combine with other filters
chromium-console-logger --stdout --level error --tabs 1,2
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
  "args": ["User logged in", { "userId": 123 }],
  "stackTrace": {
    "callFrames": [
      {
        "functionName": "login",
        "url": "http://localhost:3000/app.js",
        "lineNumber": 42,
        "columnNumber": 10
      }
    ]
  },
  "tab": {
    "id": "E4E5E5E5E5E5E5E5E5E5E5E5E5E5E5E5",
    "title": "My App - Dashboard"
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
  },
  "tab": {
    "id": "E4E5E5E5E5E5E5E5E5E5E5E5E5E5E5E5",
    "title": "My App - Dashboard"
  }
}
```

### Event Fields

| Field              | Type   | Description                                                                                |
| ------------------ | ------ | ------------------------------------------------------------------------------------------ |
| `ts`               | number | Timestamp in epoch milliseconds                                                            |
| `event`            | string | Event category: `"console"` or `"exception"`                                               |
| `type`             | string | Event type: `"log"`, `"warn"`, `"error"`, `"info"`, `"debug"`, `"trace"`, or `"exception"` |
| `url`              | string | Source URL where the event occurred (script file or page URL)                              |
| `args`             | array  | Console arguments (console events only)                                                    |
| `stackTrace`       | object | CDP StackTrace object (when available)                                                     |
| `exceptionDetails` | object | Full exception details (exception events only)                                             |
| `tab`              | object | Tab metadata: `id` (CDP target ID) and `title` (page title)                                |

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
git clone https://github.com/maelos-software/chromium-console-logger.git
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

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

### Development Setup

```bash
# Clone and install
git clone https://github.com/maelos-software/chromium-console-logger.git
cd chromium-console-logger
npm install

# Run validation checks
npm run validate  # Runs typecheck, lint, format check, and tests

# Build
npm run build
```

### CI/CD

This project uses GitHub Actions for continuous integration:

- ✅ Type checking with TypeScript
- ✅ Linting with ESLint
- ✅ Format checking with Prettier
- ✅ Unit tests with Jest (70 tests)
- ✅ Tested on Node.js 16.x, 18.x, and 20.x

All checks must pass before merging.

## Support

For issues, questions, or feature requests, please [open an issue](https://github.com/maelos-software/chromium-console-logger/issues) on GitHub.
