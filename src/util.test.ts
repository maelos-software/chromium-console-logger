import * as fc from 'fast-check';
import { safeSerialize, calculateBackoff, formatTimestamp, sleep } from './util';

describe('util', () => {
  describe('safeSerialize', () => {
    /**
     * Feature: chromium-console-logger, Property 3: Safe serialization handles non-serializable values
     * For any console argument that cannot be directly serialized to JSON (circular references,
     * functions, symbols), the safe serialization function should produce a string representation
     * without throwing errors.
     */
    it('should handle non-serializable values without throwing errors', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(undefined),
            fc.constant(Symbol('test')),
            fc.constant(() => {}),
            fc.constant(function namedFunc() {}),
            fc.bigInt(),
            fc.constant(null),
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.double(),
            fc.array(fc.anything()),
            fc.object()
          ),
          (value) => {
            // Should not throw
            const result = safeSerialize(value);

            // Result should be JSON-serializable
            expect(() => JSON.stringify(result)).not.toThrow();

            // Verify specific type handling
            if (typeof value === 'function') {
              expect(result).toBe('[Function]');
            } else if (typeof value === 'symbol') {
              expect(result).toBe('[Symbol]');
            } else if (typeof value === 'undefined') {
              expect(result).toBe('[Undefined]');
            } else if (typeof value === 'bigint') {
              expect(result).toContain('[BigInt:');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;

      const result = safeSerialize(obj);
      expect(() => JSON.stringify(result)).not.toThrow();
      expect(JSON.stringify(result)).toContain('[Circular]');
    });

    it('should preserve simple values', () => {
      expect(safeSerialize(null)).toBe(null);
      expect(safeSerialize(42)).toBe(42);
      expect(safeSerialize('hello')).toBe('hello');
      expect(safeSerialize(true)).toBe(true);
      expect(safeSerialize(false)).toBe(false);
    });

    it('should preserve simple objects and arrays', () => {
      const obj = { a: 1, b: 'test' };
      const arr = [1, 2, 3];

      expect(safeSerialize(obj)).toEqual(obj);
      expect(safeSerialize(arr)).toEqual(arr);
    });

    it('should handle values that fail JSON.stringify and String conversion', () => {
      // Create an object that throws on both JSON.stringify and String()
      const problematic = {
        toJSON() {
          throw new Error('toJSON error');
        },
        toString() {
          throw new Error('toString error');
        },
      };

      const result = safeSerialize(problematic);
      expect(result).toBe('[Unserializable]');
    });

    it('should handle values that fail JSON.stringify but succeed with String', () => {
      // Create an object that throws on JSON.stringify but works with String
      const obj = {
        toJSON() {
          throw new Error('toJSON error');
        },
        toString() {
          return 'custom string';
        },
      };

      const result = safeSerialize(obj);
      expect(result).toBe('custom string');
    });
  });

  describe('calculateBackoff', () => {
    it('should calculate exponential backoff correctly', () => {
      expect(calculateBackoff(0, 100, 5000, 0)).toBe(100);
      expect(calculateBackoff(1, 100, 5000, 0)).toBe(200);
      expect(calculateBackoff(2, 100, 5000, 0)).toBe(400);
      expect(calculateBackoff(3, 100, 5000, 0)).toBe(800);
    });

    it('should cap at maximum delay', () => {
      const result = calculateBackoff(10, 100, 5000, 0);
      expect(result).toBe(5000);
    });

    it('should add jitter within range', () => {
      const results = Array.from({ length: 100 }, () => calculateBackoff(2, 100, 5000, 20));

      // With 20% jitter on 400ms, range should be 320-480ms
      const min = Math.min(...results);
      const max = Math.max(...results);

      expect(min).toBeGreaterThanOrEqual(320);
      expect(max).toBeLessThanOrEqual(480);
    });

    it('should never return negative values', () => {
      fc.assert(
        fc.property(
          fc.nat(20),
          fc.nat(1000),
          fc.nat(10000),
          fc.nat(100),
          (attempt, initialDelay, maxDelay, jitterPercent) => {
            const result = calculateBackoff(attempt, initialDelay, maxDelay, jitterPercent);
            expect(result).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp as ISO 8601', () => {
      const timestamp = 1701234567890;
      const result = formatTimestamp(timestamp);

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(result).getTime()).toBe(timestamp);
    });

    it('should handle various timestamps', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: Date.now() + 1000000000 }), (timestamp) => {
          const result = formatTimestamp(timestamp);
          expect(new Date(result).getTime()).toBe(timestamp);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('sleep', () => {
    it('should resolve after specified milliseconds', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;

      // Allow some tolerance for timing
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(100);
    });

    it('should resolve immediately for 0ms', async () => {
      const start = Date.now();
      await sleep(0);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(10);
    });
  });
});
