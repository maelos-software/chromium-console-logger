# Implementation Plan

- [x] 1. Set up project structure and dependencies
  - Create package.json with dependencies (chrome-remote-interface, commander, ws)
  - Create tsconfig.json with strict mode and ES2020 target
  - Set up directory structure: src/, bin/, dist/
  - Configure build scripts and bin entry point
  - Install development dependencies (TypeScript, Jest, fast-check, ts-jest)
  - _Requirements: 9.4_

- [x] 2. Implement core type definitions
  - Create src/types.ts with CDPClientConfig interface
  - Define CapturedEvent interface with all required fields
  - Define LogWriterConfig interface
  - Define CLIConfig interface
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 3. Implement safe serialization utilities
  - Create src/util.ts with safeSerialize function
  - Handle circular references with replacer function
  - Handle functions, symbols, and undefined values
  - Implement exponential backoff calculator
  - Add timestamp formatting helpers
  - _Requirements: 5.8_

- [x] 3.1 Write property test for safe serialization
  - **Property 3: Safe serialization handles non-serializable values**
  - **Validates: Requirements 5.8**

- [x] 4. Implement LogWriter class
  - Create src/logWriter.ts with LogWriter class
  - Implement constructor with config validation
  - Implement write() method to append NDJSON lines
  - Implement checkRotation() to monitor file size
  - Implement rotate() method with file renaming logic
  - Implement rotation cleanup to respect rotateKeep limit
  - Implement flush() method for graceful shutdown
  - Implement close() method to close file handle
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 10.1, 10.2_

- [x] 4.1 Write property test for event serialization structure
  - **Property 2: Event serialization preserves structure**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 4.2 Write property test for log rotation integrity
  - **Property 4: Log rotation preserves data integrity**
  - **Validates: Requirements 6.3, 6.4, 6.5**

- [x] 4.3 Write unit tests for LogWriter
  - Test NDJSON line formatting
  - Test file creation and appending
  - Test rotation trigger at size threshold
  - Test rotated file cleanup
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Implement CDPClient class foundation
  - Create src/cdpClient.ts with CDPClient class extending EventEmitter
  - Implement constructor with config storage
  - Implement connect() method to establish CDP connection using chrome-remote-interface
  - Implement disconnect() method to close connection cleanly
  - Add connection state tracking
  - _Requirements: 1.1, 1.4, 1.5, 10.3_

- [x] 5.1 Write property test for connection establishment
  - **Property 1: Connection establishment with valid parameters**
  - **Validates: Requirements 1.1, 1.4, 1.5**

- [x] 6. Implement target discovery and attachment
  - Implement findTarget() method to discover available targets
  - Implement target filtering by URL substring
  - Implement logic to attach to first page target by default
  - Emit 'connected' event on successful attachment
  - _Requirements: 1.2, 1.3_

- [x] 6.1 Write property test for target selection
  - **Property 8: Target selection filters correctly**
  - **Validates: Requirements 1.3**

- [x] 6.2 Write unit tests for target discovery
  - Test target filtering with various URL patterns
  - Test first page target selection
  - _Requirements: 1.2, 1.3_

- [x] 7. Implement console event capture
  - Subscribe to Runtime.consoleAPICalled in CDP
  - Implement handleConsoleAPI() to process console events
  - Map CDP console event to CapturedEvent format
  - Extract URL from stack trace call frames
  - Serialize console arguments using safeSerialize
  - Emit 'event' with normalized CapturedEvent
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.7_

- [x] 7.1 Write property test for console event type mapping
  - **Property 9: Console event types are captured correctly**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

- [x] 7.2 Write unit tests for console event handling
  - Test event normalization from CDP format
  - Test argument serialization
  - Test URL extraction from stack trace
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 8. Implement exception event capture
  - Subscribe to Runtime.exceptionThrown in CDP
  - Implement handleException() to process exception events
  - Map CDP exception to CapturedEvent format
  - Include full stack trace and exception details
  - Emit 'event' with normalized CapturedEvent
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 8.1 Write property test for exception event structure
  - **Property 10: Exception events include stack traces**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 8.2 Write unit tests for exception handling
  - Test exception event normalization
  - Test stack trace inclusion
  - Test exception details serialization
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 9. Implement reconnection logic
  - Implement exponential backoff with 5 second maximum delay
  - Implement reconnectWithBackoff() method
  - Handle connection loss detection
  - Handle target closure detection
  - Emit 'disconnected' event on connection loss
  - Automatically retry connection until success or SIGINT
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 9.1 Write property test for reconnection backoff
  - **Property 6: Reconnection eventually succeeds**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 9.2 Write unit tests for reconnection logic
  - Test exponential backoff calculation
  - Test maximum delay enforcement
  - Test retry loop behavior
  - _Requirements: 2.1, 2.5_

- [x] 10. Implement CLI interface
  - Create src/index.ts as main entry point
  - Use commander to parse CLI arguments
  - Define all CLI flags: --host, --port, --log-file, --include-console, --include-exceptions, --level, --verbose, --target-url-substring, --max-size-bytes, --rotate-keep
  - Implement --help flag with usage information
  - Validate CLI arguments and provide error messages
  - Build CLIConfig object from parsed arguments
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 10.1 Write property test for CLI parsing
  - Generate random valid CLI arguments
  - Verify configuration is parsed correctly
  - _Requirements: 9.3_

- [x] 10.2 Write unit tests for CLI parsing
  - Test default values
  - Test custom flag values
  - Test help flag output
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 11. Implement event filtering
  - Add filtering logic in main event handler
  - Filter by includeConsole flag
  - Filter by includeExceptions flag
  - Filter by level array (match any specified level)
  - Only write events that pass all filters
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 11.1 Write property test for event filtering
  - **Property 5: Event filtering respects configuration**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 11.2 Write unit tests for filtering logic
  - Test includeConsole filter
  - Test includeExceptions filter
  - Test level filter with single value
  - Test level filter with multiple values
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 12. Implement verbose logging
  - Add verbose logging for connection establishment
  - Add verbose logging for reconnection attempts
  - Add verbose logging for target attachment
  - Add verbose logging for file rotation
  - Log to stdout when verbose flag is enabled
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 13. Wire components together in main entry point
  - Instantiate CDPClient with parsed config
  - Instantiate LogWriter with parsed config
  - Connect CDPClient 'event' to filtering logic
  - Connect filtered events to LogWriter.write()
  - Call CDPClient.connect() to start
  - _Requirements: 1.1, 1.2_

- [x] 14. Implement graceful shutdown
  - Register SIGINT handler in main entry point
  - Call LogWriter.flush() on SIGINT
  - Call LogWriter.close() after flush
  - Call CDPClient.disconnect() on SIGINT
  - Exit with status code 0 after cleanup
  - _Requirements: 2.4, 10.1, 10.2, 10.3, 10.4_

- [x] 14.1 Write property test for graceful shutdown
  - **Property 7: Graceful shutdown flushes all data**
  - **Validates: Requirements 10.1, 10.2**

- [x] 14.2 Write unit tests for shutdown handling
  - Test SIGINT handler registration
  - Test flush is called before close
  - Test disconnect is called
  - Test exit code is 0
  - _Requirements: 2.4, 10.1, 10.2, 10.3, 10.4_

- [x] 15. Create bin script
  - Create bin/chromium-console-logger as executable shell script
  - Add shebang: #!/usr/bin/env node
  - Require and execute dist/index.js
  - Make file executable (chmod +x)
  - _Requirements: 9.4_

- [x] 16. Create comprehensive README
  - Document purpose and overview
  - Document installation instructions
  - Document how to launch browser with CDP enabled
  - Document CLI usage with all flags
  - Provide NDJSON output examples
  - Include troubleshooting section
  - Add examples for common use cases
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 17. Create helper scripts for macOS
  - Create launch-chromium-with-cdp.command script
  - Create start-logger.command script
  - Make scripts executable
  - Test scripts on macOS
  - _Requirements: 1.1_

- [x] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
