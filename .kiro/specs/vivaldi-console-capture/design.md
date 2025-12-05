# Design Document

## Overview

The Vivaldi Console Capture tool is a Node.js + TypeScript CLI application that connects to Chromium-based browsers via the Chrome DevTools Protocol (CDP) to capture console events and exceptions, streaming them to NDJSON log files with automatic reconnection and log rotation capabilities.

The tool is designed as a standalone developer utility that runs continuously in the background, providing reliable console capture even when the browser restarts. It uses the `chrome-remote-interface` library for CDP communication and implements robust error handling, exponential backoff reconnection, and configurable filtering.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Entry Point                       │
│                     (index.ts)                          │
│  - Parse command-line arguments                         │
│  - Initialize components                                │
│  - Wire event handlers                                  │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│  CDP Client  │  │  Log Writer   │
│              │  │               │
│ - Connect    │  │ - Write NDJSON│
│ - Subscribe  │  │ - Rotate logs │
│ - Reconnect  │  │ - Flush       │
└──────┬───────┘  └───────────────┘
       │
       │ CDP Protocol
       │
┌──────▼──────────────────────────┐
│   Chromium Browser (CDP Port)   │
│   - Console events               │
│   - Exception events             │
└──────────────────────────────────┘
```

### Component Responsibilities

**CLI Entry Point (index.ts)**
- Parses command-line arguments using a CLI parsing library (commander or yargs)
- Validates configuration
- Instantiates CDPClient and LogWriter
- Connects event streams
- Handles SIGINT for graceful shutdown

**CDP Client (cdpClient.ts)**
- Manages WebSocket connection to CDP endpoint
- Implements exponential backoff reconnection logic
- Discovers and attaches to browser targets
- Subscribes to Runtime.consoleAPICalled and Runtime.exceptionThrown
- Normalizes CDP events into a common format
- Emits events via EventEmitter pattern

**Log Writer (logWriter.ts)**
- Appends NDJSON lines to the configured log file
- Monitors file size and triggers rotation
- Manages rotated file naming and cleanup
- Provides flush method for graceful shutdown
- Handles file system errors gracefully

**Types (types.ts)**
- TypeScript interfaces for configuration
- Event payload types
- CDP message types

**Utilities (util.ts)**
- Safe JSON serialization with fallback to string conversion
- Exponential backoff calculator
- Timestamp formatting helpers

## Components and Interfaces

### CDPClient

```typescript
interface CDPClientConfig {
  host: string;
  port: number;
  targetUrlSubstring?: string;
  verbose: boolean;
}

interface CapturedEvent {
  ts: number;
  event: 'console' | 'exception';
  type: string;
  url: string;
  stackTrace?: any;
  args?: any[];
  exceptionDetails?: any;
}

class CDPClient extends EventEmitter {
  constructor(config: CDPClientConfig);
  
  async connect(): Promise<void>;
  async disconnect(): Promise<void>;
  
  // Events emitted:
  // - 'event': (event: CapturedEvent) => void
  // - 'connected': () => void
  // - 'disconnected': () => void
}
```

**Key Methods:**
- `connect()`: Establishes CDP connection, discovers targets, attaches to appropriate target
- `disconnect()`: Cleanly closes CDP connection
- `handleConsoleAPI(params)`: Processes Runtime.consoleAPICalled events
- `handleException(params)`: Processes Runtime.exceptionThrown events
- `reconnectWithBackoff()`: Implements exponential backoff reconnection
- `findTarget()`: Discovers and filters targets based on URL substring

### LogWriter

```typescript
interface LogWriterConfig {
  logFile: string;
  maxSizeBytes?: number;
  rotateKeep?: number;
  verbose: boolean;
}

class LogWriter {
  constructor(config: LogWriterConfig);
  
  write(event: CapturedEvent): void;
  async flush(): Promise<void>;
  async close(): Promise<void>;
  
  private rotate(): void;
  private checkRotation(): void;
}
```

**Key Methods:**
- `write(event)`: Serializes event to NDJSON and appends to file
- `flush()`: Ensures all buffered data is written to disk
- `close()`: Closes file handle
- `rotate()`: Renames current file, manages rotation count
- `checkRotation()`: Monitors file size and triggers rotation

### CLI Configuration

```typescript
interface CLIConfig {
  host: string;
  port: number;
  logFile: string;
  includeConsole: boolean;
  includeExceptions: boolean;
  level: string[];
  verbose: boolean;
  targetUrlSubstring?: string;
  maxSizeBytes?: number;
  rotateKeep?: number;
}
```

## Data Models

### CapturedEvent

The normalized event structure written to NDJSON:

```typescript
interface CapturedEvent {
  ts: number;              // Epoch milliseconds
  event: 'console' | 'exception';
  type: string;            // log, warn, error, etc. or 'exception'
  url: string;             // Source URL where event occurred
  stackTrace?: StackTrace; // CDP StackTrace object if available
  args?: any[];            // Console arguments (for console events)
  exceptionDetails?: any;  // Full exception details (for exceptions)
}
```

Example NDJSON output:

```json
{"ts":1701234567890,"event":"console","type":"log","url":"http://localhost:3000/app.js","args":["hello",{"foo":"bar"}]}
{"ts":1701234567891,"event":"console","type":"error","url":"http://localhost:3000/app.js","args":["boom"]}
{"ts":1701234567892,"event":"exception","type":"exception","url":"http://localhost:3000/app.js","stackTrace":{...},"exceptionDetails":{...}}
```

### CDP Event Mapping

**Runtime.consoleAPICalled → CapturedEvent**
```typescript
{
  ts: Date.now(),
  event: 'console',
  type: params.type,  // 'log', 'warn', 'error', etc.
  url: params.stackTrace?.callFrames[0]?.url || 'unknown',
  args: params.args.map(arg => safeSerialize(arg)),
  stackTrace: params.stackTrace
}
```

**Runtime.exceptionThrown → CapturedEvent**
```typescript
{
  ts: Date.now(),
  event: 'exception',
  type: 'exception',
  url: params.exceptionDetails.url || 'unknown',
  stackTrace: params.exceptionDetails.stackTrace,
  exceptionDetails: params.exceptionDetails
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Connection establishment with valid parameters

*For any* valid host and port combination where a CDP-enabled browser is listening, the CDPClient should successfully establish a connection and emit a 'connected' event.

**Validates: Requirements 1.1, 1.4, 1.5**

### Property 2: Event serialization preserves structure

*For any* captured event, serializing to NDJSON and then parsing should produce an object with all required fields (ts, event, type, url) present and of correct types.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 3: Safe serialization handles non-serializable values

*For any* console argument that cannot be directly serialized to JSON (circular references, functions, symbols), the safe serialization function should produce a string representation without throwing errors.

**Validates: Requirements 5.8**

### Property 4: Log rotation preserves data integrity

*For any* sequence of events written to a log file, when rotation occurs, all events should be present across the current and rotated files with no duplicates or missing entries.

**Validates: Requirements 6.3, 6.4, 6.5**

### Property 5: Event filtering respects configuration

*For any* event and filter configuration (includeConsole, includeExceptions, level), an event should be written to the log file if and only if it matches the filter criteria.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 6: Reconnection eventually succeeds

*For any* connection loss scenario where the CDP endpoint becomes available again within a reasonable time window, the CDPClient should successfully reconnect without manual intervention.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 7: Graceful shutdown flushes all data

*For any* state of the LogWriter with buffered data, calling flush() followed by close() should result in all buffered events being written to disk before the file handle is closed.

**Validates: Requirements 10.1, 10.2**

### Property 8: Target selection filters correctly

*For any* set of available targets and a URL substring filter, the selected target should have a URL containing the specified substring, or no target should be selected if none match.

**Validates: Requirements 1.3**

### Property 9: Console event types are captured correctly

*For any* console method invocation (log, info, warn, error, debug, trace), the captured event should have the event field set to "console" and the type field matching the console method name.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 10: Exception events include stack traces

*For any* uncaught exception in the browser, the captured event should have event field set to "exception" and should include a stackTrace field when available from CDP.

**Validates: Requirements 4.1, 4.2, 4.3**

## Error Handling

### Connection Errors

**Scenario**: CDP endpoint is not available
- **Handling**: Log error if verbose, wait with exponential backoff, retry
- **User Impact**: Tool continues running, automatically connects when browser starts

**Scenario**: Network error during active connection
- **Handling**: Detect disconnection, trigger reconnection logic
- **User Impact**: Brief gap in capture, automatic recovery

**Scenario**: Target closes or navigates away
- **Handling**: Detect target detachment, attempt to reattach to available target
- **User Impact**: Seamless continuation with new target

### File System Errors

**Scenario**: Log file path is not writable
- **Handling**: Log error to stderr, exit with non-zero status
- **User Impact**: Clear error message indicating permission issue

**Scenario**: Disk full during write
- **Handling**: Log error to stderr, attempt to continue (may lose events)
- **User Impact**: Warning logged, some events may be lost

**Scenario**: Rotation fails due to file system error
- **Handling**: Log error to stderr, continue writing to current file
- **User Impact**: File may exceed size limit, but capture continues

### Serialization Errors

**Scenario**: Event argument contains circular reference
- **Handling**: Use safe serialization that converts to "[Circular]" string
- **User Impact**: Event is captured with string representation

**Scenario**: Event argument is a function or symbol
- **Handling**: Convert to string representation (e.g., "[Function]", "[Symbol]")
- **User Impact**: Event is captured with type indicator

### CLI Errors

**Scenario**: Invalid command-line arguments
- **Handling**: Display error message and usage information, exit with status 1
- **User Impact**: Clear feedback on what went wrong

**Scenario**: Conflicting options (e.g., includeConsole=false and level filters)
- **Handling**: Accept configuration as-is, level filters have no effect if includeConsole=false
- **User Impact**: Configuration is applied literally

## Testing Strategy

### Unit Testing

The project will use **Jest** as the testing framework for unit tests. Unit tests will cover:

**CDPClient Unit Tests**
- Connection establishment with valid parameters
- Error handling for invalid host/port
- Event normalization from CDP format to CapturedEvent
- Target filtering logic with various URL patterns
- Exponential backoff calculation

**LogWriter Unit Tests**
- NDJSON line formatting
- File creation and appending
- Rotation trigger at size threshold
- Rotated file naming and cleanup
- Flush and close operations

**Utility Function Unit Tests**
- Safe JSON serialization with circular references
- Safe JSON serialization with functions and symbols
- Timestamp formatting
- Exponential backoff calculation with max limit

### Property-Based Testing

The project will use **fast-check** as the property-based testing library. Property-based tests will run a minimum of 100 iterations per test.

Each property-based test will be tagged with a comment explicitly referencing the correctness property from this design document using the format: `**Feature: vivaldi-console-capture, Property {number}: {property_text}**`

**Property Test 1: Connection establishment**
- Generate random valid host/port combinations
- Verify connection succeeds when CDP endpoint is available
- **Feature: vivaldi-console-capture, Property 1: Connection establishment with valid parameters**

**Property Test 2: Event serialization round-trip**
- Generate random CapturedEvent objects
- Serialize to NDJSON, parse back, verify structure
- **Feature: vivaldi-console-capture, Property 2: Event serialization preserves structure**

**Property Test 3: Safe serialization**
- Generate objects with circular references, functions, symbols
- Verify safe serialization produces strings without errors
- **Feature: vivaldi-console-capture, Property 3: Safe serialization handles non-serializable values**

**Property Test 4: Log rotation integrity**
- Generate random sequences of events
- Write with rotation enabled, verify all events present
- **Feature: vivaldi-console-capture, Property 4: Log rotation preserves data integrity**

**Property Test 5: Event filtering**
- Generate random events and filter configurations
- Verify only matching events are written
- **Feature: vivaldi-console-capture, Property 5: Event filtering respects configuration**

**Property Test 6: Target selection**
- Generate random target lists and URL substrings
- Verify correct target is selected or none if no match
- **Feature: vivaldi-console-capture, Property 8: Target selection filters correctly**

**Property Test 7: Console event type mapping**
- Generate random console events with different types
- Verify event and type fields are set correctly
- **Feature: vivaldi-console-capture, Property 9: Console event types are captured correctly**

**Property Test 8: Exception event structure**
- Generate random exception events
- Verify event field is "exception" and stackTrace is included
- **Feature: vivaldi-console-capture, Property 10: Exception events include stack traces**

### Integration Testing

Integration tests will verify end-to-end functionality:

- Start tool, connect to real CDP endpoint, verify events are captured
- Simulate browser restart, verify reconnection works
- Write events until rotation, verify files are rotated correctly
- Send SIGINT, verify graceful shutdown and data flush

### Manual Testing Checklist

- Launch Vivaldi with `--remote-debugging-port=9222`
- Run tool with default settings, verify connection
- Execute `console.log("test")` in browser, verify NDJSON line appears
- Execute `throw new Error("test")`, verify exception is captured
- Close browser, verify tool continues running
- Reopen browser, verify tool reconnects
- Test various CLI flags (--verbose, --level, --target-url-substring)
- Test log rotation by generating many events
- Test SIGINT handling (Ctrl+C)

## Implementation Notes

### Dependencies

**Production Dependencies**
- `chrome-remote-interface`: CDP client library
- `commander`: CLI argument parsing
- `ws`: WebSocket client (peer dependency for chrome-remote-interface)

**Development Dependencies**
- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions
- `jest`: Testing framework
- `@types/jest`: Jest type definitions
- `fast-check`: Property-based testing library
- `ts-jest`: TypeScript support for Jest
- `eslint`: Code linting
- `prettier`: Code formatting

### Build Configuration

**tsconfig.json**
- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Output directory: `dist/`
- Source maps enabled for debugging

**package.json**
- Main entry: `dist/index.js`
- Bin entry: `vivaldi-console-capture` → `bin/vivaldi-console-capture`
- Scripts: `build`, `test`, `lint`, `format`

### Reconnection Strategy

Exponential backoff with jitter:
- Initial delay: 100ms
- Multiplier: 2x
- Maximum delay: 5000ms
- Jitter: ±20% random variation

Example sequence: 100ms, 200ms, 400ms, 800ms, 1600ms, 3200ms, 5000ms, 5000ms...

### File Rotation Algorithm

```
1. Check file size after each write
2. If size > maxSizeBytes:
   a. Close current file handle
   b. Shift existing rotated files: .N → .N+1
   c. Rename current file to .1
   d. Delete files beyond rotateKeep limit
   e. Open new file handle
```

### Safe Serialization Strategy

```typescript
function safeSerialize(value: any): any {
  try {
    // Attempt direct serialization
    JSON.stringify(value);
    return value;
  } catch (error) {
    // Handle circular references, functions, etc.
    if (typeof value === 'function') return '[Function]';
    if (typeof value === 'symbol') return '[Symbol]';
    if (typeof value === 'undefined') return '[Undefined]';
    
    // For objects with circular references
    try {
      return JSON.parse(JSON.stringify(value, getCircularReplacer()));
    } catch {
      return String(value);
    }
  }
}
```

## Performance Considerations

- Use streaming writes to avoid memory buildup
- Implement buffering with periodic flushes (e.g., every 100ms or 100 events)
- Avoid synchronous file operations in the hot path
- Use efficient JSON serialization (native JSON.stringify)
- Limit stack trace depth to prevent excessive data capture

## Security Considerations

- Tool connects only to localhost by default (127.0.0.1)
- No remote connections without explicit host configuration
- File paths are validated to prevent directory traversal
- No execution of code from captured events
- Log files contain only captured data, no sensitive tool internals

## Future Enhancements

- Support for filtering by URL pattern (regex)
- Support for custom event transformations
- Support for multiple output formats (JSON array, CSV)
- Support for remote log shipping (HTTP POST, syslog)
- Support for real-time event streaming to stdout
- Support for event deduplication
- Support for compression of rotated files
