# Requirements Document

## Introduction

The Chromium Console Logger is a standalone local developer tool that connects to Chromium-based browsers (Chrome, Vivaldi, Brave, Edge) via the Chrome DevTools Protocol (CDP) to capture JavaScript console events and uncaught exceptions, streaming them to a local NDJSON file with automatic reconnection capabilities.

## Glossary

- **CDP**: Chrome DevTools Protocol - a protocol for instrumenting, inspecting, debugging and profiling Chromium-based browsers
- **NDJSON**: Newline Delimited JSON - a format where each line is a valid JSON object
- **Target**: A CDP entity representing a page, worker, or other debuggable context in the browser
- **Console Capture Tool**: The system being developed that captures browser console output
- **Rotation**: The process of archiving a log file when it exceeds a size threshold and creating a new file

## Requirements

### Requirement 1

**User Story:** As a developer, I want to connect to my Chromium browser via CDP, so that I can capture console events from my running application.

#### Acceptance Criteria

1. WHEN the Console Capture Tool starts with default settings, THE Console Capture Tool SHALL connect to host 127.0.0.1 on port 9222
2. WHEN the Console Capture Tool successfully connects to CDP, THE Console Capture Tool SHALL attach to the first available page target
3. WHERE a target URL substring is specified, THE Console Capture Tool SHALL attach only to targets whose URL contains the specified substring
4. WHEN the Console Capture Tool receives a custom host via CLI flag, THE Console Capture Tool SHALL connect to the specified host address
5. WHEN the Console Capture Tool receives a custom port via CLI flag, THE Console Capture Tool SHALL connect to the specified port number

### Requirement 2

**User Story:** As a developer, I want the tool to automatically reconnect when my browser restarts, so that I don't lose console capture during development sessions.

#### Acceptance Criteria

1. WHEN the browser connection is lost, THE Console Capture Tool SHALL retry connection with exponential backoff up to 5 seconds maximum delay
2. WHEN the attached target closes, THE Console Capture Tool SHALL detect the closure and attempt to reattach to an available target
3. WHEN the browser process restarts, THE Console Capture Tool SHALL detect the restart and reconnect seamlessly without manual intervention
4. WHEN receiving SIGINT signal, THE Console Capture Tool SHALL terminate gracefully and exit the process
5. WHILE connection attempts are ongoing, THE Console Capture Tool SHALL continue retrying until successful connection or SIGINT is received

### Requirement 3

**User Story:** As a developer, I want to capture all JavaScript console events, so that I can monitor application behavior and debug issues.

#### Acceptance Criteria

1. WHEN the browser executes console.log, THE Console Capture Tool SHALL capture the event with type "log"
2. WHEN the browser executes console.info, THE Console Capture Tool SHALL capture the event with type "info"
3. WHEN the browser executes console.warn, THE Console Capture Tool SHALL capture the event with type "warn"
4. WHEN the browser executes console.error, THE Console Capture Tool SHALL capture the event with type "error"
5. WHEN the browser executes console.debug, THE Console Capture Tool SHALL capture the event with type "debug"
6. WHEN the browser executes console.trace, THE Console Capture Tool SHALL capture the event with type "trace"

### Requirement 4

**User Story:** As a developer, I want to capture uncaught exceptions, so that I can identify and fix runtime errors in my application.

#### Acceptance Criteria

1. WHEN an uncaught exception occurs in the browser, THE Console Capture Tool SHALL capture the exception details via Runtime.exceptionThrown
2. WHEN an exception is captured, THE Console Capture Tool SHALL include the full stack trace in the logged event
3. WHEN an exception is captured, THE Console Capture Tool SHALL record the event type as "exception"

### Requirement 5

**User Story:** As a developer, I want captured events written to an NDJSON file, so that I can process and analyze console output programmatically.

#### Acceptance Criteria

1. WHEN an event is captured, THE Console Capture Tool SHALL serialize the event as a single line of valid JSON
2. WHEN serializing an event, THE Console Capture Tool SHALL include timestamp in epoch milliseconds with key "ts"
3. WHEN serializing an event, THE Console Capture Tool SHALL include event category with key "event" and value "console" or "exception"
4. WHEN serializing an event, THE Console Capture Tool SHALL include event type with key "type"
5. WHEN serializing an event, THE Console Capture Tool SHALL include source URL with key "url"
6. WHERE a stack trace is available, THE Console Capture Tool SHALL include it with key "stackTrace"
7. WHEN serializing console events, THE Console Capture Tool SHALL include arguments array with key "args"
8. WHEN an argument cannot be serialized to JSON, THE Console Capture Tool SHALL convert it to a string representation safely

### Requirement 6

**User Story:** As a developer, I want to configure the log file location and behavior, so that I can organize captured logs according to my project structure.

#### Acceptance Criteria

1. WHEN the Console Capture Tool starts without a log-file flag, THE Console Capture Tool SHALL write to "browser-console.ndjson" in the current working directory
2. WHEN the Console Capture Tool receives a log-file path via CLI flag, THE Console Capture Tool SHALL write captured events to the specified file path
3. WHEN the log file size exceeds the max-size-bytes threshold, THE Console Capture Tool SHALL rename the current file by appending ".1" to the filename
4. WHEN rotating log files, THE Console Capture Tool SHALL keep only the number of rotated files specified by rotate-keep parameter
5. WHEN the rotate-keep limit is exceeded, THE Console Capture Tool SHALL delete the oldest rotated file

### Requirement 7

**User Story:** As a developer, I want to filter captured events by type and level, so that I can focus on relevant console output.

#### Acceptance Criteria

1. WHERE include-console flag is set to false, THE Console Capture Tool SHALL exclude all console events from capture
2. WHERE include-exceptions flag is set to false, THE Console Capture Tool SHALL exclude all exception events from capture
3. WHERE level filter is specified, THE Console Capture Tool SHALL capture only events matching the specified level values
4. WHEN multiple level filters are provided, THE Console Capture Tool SHALL capture events matching any of the specified levels

### Requirement 8

**User Story:** As a developer, I want verbose logging output, so that I can troubleshoot connection and capture issues.

#### Acceptance Criteria

1. WHERE verbose flag is enabled, THE Console Capture Tool SHALL log connection establishment messages to standard output
2. WHERE verbose flag is enabled, THE Console Capture Tool SHALL log reconnection attempt messages to standard output
3. WHERE verbose flag is enabled, THE Console Capture Tool SHALL log target attachment messages to standard output
4. WHERE verbose flag is enabled, THE Console Capture Tool SHALL log file rotation messages to standard output

### Requirement 9

**User Story:** As a developer, I want a simple CLI interface, so that I can easily start and configure the capture tool.

#### Acceptance Criteria

1. WHEN the Console Capture Tool is invoked without arguments, THE Console Capture Tool SHALL start with default configuration values
2. WHEN the Console Capture Tool is invoked with --help flag, THE Console Capture Tool SHALL display usage information and available options
3. WHEN the Console Capture Tool receives CLI flags, THE Console Capture Tool SHALL parse and apply the configuration values
4. WHEN the Console Capture Tool is installed via npm, THE Console Capture Tool SHALL be executable via npx command

### Requirement 10

**User Story:** As a developer, I want the tool to handle shutdown gracefully, so that no captured events are lost when I stop the process.

#### Acceptance Criteria

1. WHEN the Console Capture Tool receives SIGINT signal, THE Console Capture Tool SHALL flush all buffered log data to disk
2. WHEN the Console Capture Tool receives SIGINT signal, THE Console Capture Tool SHALL close the log file handle cleanly
3. WHEN the Console Capture Tool receives SIGINT signal, THE Console Capture Tool SHALL disconnect from CDP gracefully
4. WHEN graceful shutdown completes, THE Console Capture Tool SHALL exit with status code 0
