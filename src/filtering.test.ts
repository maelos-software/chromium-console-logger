import * as fc from 'fast-check';
import { CapturedEvent, CLIConfig } from './types';

/**
 * Event filtering logic extracted for testing
 */
function shouldIncludeEvent(event: CapturedEvent, config: CLIConfig): boolean {
  // Apply console filter
  if (event.event === 'console' && !config.includeConsole) {
    return false;
  }

  // Apply exception filter
  if (event.event === 'exception' && !config.includeExceptions) {
    return false;
  }

  // Apply level filter for console events
  if (event.event === 'console' && config.level.length > 0) {
    if (!config.level.includes(event.type)) {
      return false;
    }
  }

  return true;
}

describe('Event Filtering', () => {
  /**
   * Feature: vivaldi-console-capture, Property 5: Event filtering respects configuration
   * For any event and filter configuration (includeConsole, includeExceptions, level),
   * an event should be written to the log file if and only if it matches the filter criteria.
   */
  describe('Property 5: Event filtering respects configuration', () => {
    it('should filter console events when includeConsole is false', () => {
      fc.assert(
        fc.property(
          fc.record({
            ts: fc.integer({ min: 0 }),
            event: fc.constant('console' as const),
            type: fc.constantFrom('log', 'warn', 'error', 'info', 'debug', 'trace'),
            url: fc.webUrl(),
          }),
          (event: CapturedEvent) => {
            const config: CLIConfig = {
              host: '127.0.0.1',
              port: 9222,
              logFile: 'test.ndjson',
              includeConsole: false,
              includeExceptions: true,
              level: [],
              verbose: false,
            };

            const result = shouldIncludeEvent(event, config);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter exception events when includeExceptions is false', () => {
      fc.assert(
        fc.property(
          fc.record({
            ts: fc.integer({ min: 0 }),
            event: fc.constant('exception' as const),
            type: fc.constant('exception'),
            url: fc.webUrl(),
          }),
          (event: CapturedEvent) => {
            const config: CLIConfig = {
              host: '127.0.0.1',
              port: 9222,
              logFile: 'test.ndjson',
              includeConsole: true,
              includeExceptions: false,
              level: [],
              verbose: false,
            };

            const result = shouldIncludeEvent(event, config);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter console events by level', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('log', 'warn', 'error', 'info', 'debug', 'trace'),
          (eventType: string) => {
            const event: CapturedEvent = {
              ts: Date.now(),
              event: 'console',
              type: eventType,
              url: 'http://test.com',
            };

            const config: CLIConfig = {
              host: '127.0.0.1',
              port: 9222,
              logFile: 'test.ndjson',
              includeConsole: true,
              includeExceptions: true,
              level: ['error', 'warn'],
              verbose: false,
            };

            const result = shouldIncludeEvent(event, config);
            const shouldInclude = config.level.includes(eventType);
            expect(result).toBe(shouldInclude);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all events when no filters are applied', () => {
      fc.assert(
        fc.property(
          fc.record({
            ts: fc.integer({ min: 0 }),
            event: fc.constantFrom('console' as const, 'exception' as const),
            type: fc.string(),
            url: fc.webUrl(),
          }),
          (event: CapturedEvent) => {
            const config: CLIConfig = {
              host: '127.0.0.1',
              port: 9222,
              logFile: 'test.ndjson',
              includeConsole: true,
              includeExceptions: true,
              level: [],
              verbose: false,
            };

            const result = shouldIncludeEvent(event, config);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit tests for filtering logic', () => {
    it('should exclude console events when includeConsole is false', () => {
      const event: CapturedEvent = {
        ts: Date.now(),
        event: 'console',
        type: 'log',
        url: 'http://test.com',
      };

      const config: CLIConfig = {
        host: '127.0.0.1',
        port: 9222,
        logFile: 'test.ndjson',
        includeConsole: false,
        includeExceptions: true,
        level: [],
        verbose: false,
      };

      expect(shouldIncludeEvent(event, config)).toBe(false);
    });

    it('should exclude exception events when includeExceptions is false', () => {
      const event: CapturedEvent = {
        ts: Date.now(),
        event: 'exception',
        type: 'exception',
        url: 'http://test.com',
      };

      const config: CLIConfig = {
        host: '127.0.0.1',
        port: 9222,
        logFile: 'test.ndjson',
        includeConsole: true,
        includeExceptions: false,
        level: [],
        verbose: false,
      };

      expect(shouldIncludeEvent(event, config)).toBe(false);
    });

    it('should filter by single level', () => {
      const errorEvent: CapturedEvent = {
        ts: Date.now(),
        event: 'console',
        type: 'error',
        url: 'http://test.com',
      };

      const logEvent: CapturedEvent = {
        ts: Date.now(),
        event: 'console',
        type: 'log',
        url: 'http://test.com',
      };

      const config: CLIConfig = {
        host: '127.0.0.1',
        port: 9222,
        logFile: 'test.ndjson',
        includeConsole: true,
        includeExceptions: true,
        level: ['error'],
        verbose: false,
      };

      expect(shouldIncludeEvent(errorEvent, config)).toBe(true);
      expect(shouldIncludeEvent(logEvent, config)).toBe(false);
    });

    it('should filter by multiple levels', () => {
      const errorEvent: CapturedEvent = {
        ts: Date.now(),
        event: 'console',
        type: 'error',
        url: 'http://test.com',
      };

      const warnEvent: CapturedEvent = {
        ts: Date.now(),
        event: 'console',
        type: 'warn',
        url: 'http://test.com',
      };

      const logEvent: CapturedEvent = {
        ts: Date.now(),
        event: 'console',
        type: 'log',
        url: 'http://test.com',
      };

      const config: CLIConfig = {
        host: '127.0.0.1',
        port: 9222,
        logFile: 'test.ndjson',
        includeConsole: true,
        includeExceptions: true,
        level: ['error', 'warn'],
        verbose: false,
      };

      expect(shouldIncludeEvent(errorEvent, config)).toBe(true);
      expect(shouldIncludeEvent(warnEvent, config)).toBe(true);
      expect(shouldIncludeEvent(logEvent, config)).toBe(false);
    });

    it('should not filter exceptions by level', () => {
      const exceptionEvent: CapturedEvent = {
        ts: Date.now(),
        event: 'exception',
        type: 'exception',
        url: 'http://test.com',
      };

      const config: CLIConfig = {
        host: '127.0.0.1',
        port: 9222,
        logFile: 'test.ndjson',
        includeConsole: true,
        includeExceptions: true,
        level: ['error'],
        verbose: false,
      };

      expect(shouldIncludeEvent(exceptionEvent, config)).toBe(true);
    });
  });
});
