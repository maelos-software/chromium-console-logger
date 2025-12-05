/**
 * Configuration for the CDP Client
 */
export interface CDPClientConfig {
  host: string;
  port: number;
  targetUrlSubstring?: string;
  verbose: boolean;
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
}
