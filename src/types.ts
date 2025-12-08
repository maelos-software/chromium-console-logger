/**
 * Configuration for the CDP Client
 */
export interface CDPClientConfig {
  host: string;
  port: number;
  targetUrlSubstring?: string;
  verbose: boolean;
  tabIndices?: number[]; // 1-based tab indices to monitor
}

/**
 * Normalized event structure captured from the browser
 */
export interface CapturedEvent {
  ts: number; // Epoch milliseconds
  event: 'console' | 'exception';
  type: string; // log, warn, error, etc. or 'exception'
  url: string; // Source URL where event occurred
  stackTrace?: any; // CDP StackTrace object if available
  args?: any[]; // Console arguments (for console events)
  exceptionDetails?: any; // Full exception details (for exceptions)
  tab?: {
    // Tab metadata
    id: string; // CDP target ID
    title: string; // Page title
  };
}

/**
 * Configuration for the Log Writer
 */
export interface LogWriterConfig {
  logFile: string;
  maxSizeBytes?: number;
  rotateKeep?: number;
  verbose: boolean;
}

/**
 * Complete CLI configuration
 */
export interface CLIConfig {
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
  listTabs?: boolean;
  tabs?: number[]; // Tab indices to monitor (1-based)
  stdout?: boolean; // Output logs to stdout instead of file
}
