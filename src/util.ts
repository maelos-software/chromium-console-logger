/**
 * Utility functions for the Vivaldi Console Capture tool
 */

/**
 * Creates a replacer function for JSON.stringify that handles circular references
 */
function getCircularReplacer() {
  const seen = new WeakSet();
  return (_key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
}

/**
 * Safely serializes a value to JSON, handling circular references, functions, symbols, etc.
 * @param value The value to serialize
 * @returns A JSON-serializable representation of the value
 */
export function safeSerialize(value: any): any {
  // Handle primitive types that can't be serialized
  if (typeof value === 'function') return '[Function]';
  if (typeof value === 'symbol') return '[Symbol]';
  if (typeof value === 'undefined') return '[Undefined]';
  if (typeof value === 'bigint') return `[BigInt: ${value.toString()}]`;

  // Handle null and simple types
  if (value === null || typeof value !== 'object') {
    return value;
  }

  // Try direct serialization first
  try {
    JSON.stringify(value);
    return value;
  } catch (error) {
    // Handle circular references and other serialization issues
    try {
      return JSON.parse(JSON.stringify(value, getCircularReplacer()));
    } catch {
      // Last resort: convert to string
      try {
        return String(value);
      } catch {
        return '[Unserializable]';
      }
    }
  }
}

/**
 * Calculates the next delay for exponential backoff
 * @param attempt The current attempt number (0-indexed)
 * @param initialDelay Initial delay in milliseconds (default: 100)
 * @param maxDelay Maximum delay in milliseconds (default: 5000)
 * @param jitterPercent Percentage of jitter to add (default: 20)
 * @returns The delay in milliseconds
 */
export function calculateBackoff(
  attempt: number,
  initialDelay: number = 100,
  maxDelay: number = 5000,
  jitterPercent: number = 20
): number {
  // Calculate exponential delay: initialDelay * 2^attempt
  const exponentialDelay = initialDelay * Math.pow(2, attempt);
  
  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  // Add jitter: ±jitterPercent of the delay
  const jitterRange = cappedDelay * (jitterPercent / 100);
  const jitter = (Math.random() * 2 - 1) * jitterRange;
  
  return Math.max(0, Math.round(cappedDelay + jitter));
}

/**
 * Formats a timestamp as ISO 8601 string
 * @param timestamp Epoch milliseconds
 * @returns ISO 8601 formatted string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Sleeps for the specified duration
 * @param ms Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
