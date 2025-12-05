import * as fs from 'fs';
import * as path from 'path';
import { LogWriter } from './logWriter';
import { CapturedEvent } from './types';

describe('Graceful Shutdown', () => {
  const testLogDir = path.join(__dirname, '../test-logs-shutdown');

  beforeAll(() => {
    if (!fs.existsSync(testLogDir)) {
      fs.mkdirSync(testLogDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testLogDir)) {
      const files = fs.readdirSync(testLogDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(testLogDir, file));
      });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testLogDir)) {
      fs.rmdirSync(testLogDir);
    }
  });

  /**
   * Feature: vivaldi-console-capture, Property 7: Graceful shutdown flushes all data
   * For any state of the LogWriter with buffered data, calling flush() followed by close()
   * should result in all buffered events being written to disk before the file handle is closed.
   */
  describe('Property 7: Graceful shutdown flushes all data', () => {
    it('should flush all buffered data before closing', async () => {
      const logFile = path.join(testLogDir, `shutdown-test-${Date.now()}.ndjson`);
      const writer = new LogWriter({
        logFile,
        verbose: false,
      });

      // Write multiple events
      const events: CapturedEvent[] = [];
      for (let i = 0; i < 10; i++) {
        const event: CapturedEvent = {
          ts: Date.now() + i,
          event: 'console',
          type: 'log',
          url: 'http://test.com',
          args: [`message ${i}`],
        };
        events.push(event);
        writer.write(event);
      }

      // Flush and close
      await writer.flush();
      await writer.close();

      // Verify all events were written
      expect(fs.existsSync(logFile)).toBe(true);

      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(events.length);

      // Verify each event
      lines.forEach((line, index) => {
        const parsed = JSON.parse(line);
        expect(parsed.ts).toBe(events[index].ts);
      });
    });

    it('should handle flush when no data is buffered', async () => {
      const logFile = path.join(testLogDir, `empty-flush-${Date.now()}.ndjson`);
      const writer = new LogWriter({
        logFile,
        verbose: false,
      });

      // Flush without writing anything
      await expect(writer.flush()).resolves.not.toThrow();
      await expect(writer.close()).resolves.not.toThrow();
    });

    it('should handle multiple flush calls', async () => {
      const logFile = path.join(testLogDir, `multiple-flush-${Date.now()}.ndjson`);
      const writer = new LogWriter({
        logFile,
        verbose: false,
      });

      const event: CapturedEvent = {
        ts: Date.now(),
        event: 'console',
        type: 'log',
        url: 'http://test.com',
        args: ['test'],
      };

      writer.write(event);

      await writer.flush();
      await writer.flush();
      await writer.flush();

      await writer.close();

      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(1);
    });
  });

  describe('Unit tests for shutdown handling', () => {
    it('should close file handle cleanly', async () => {
      const logFile = path.join(testLogDir, `close-test-${Date.now()}.ndjson`);
      const writer = new LogWriter({
        logFile,
        verbose: false,
      });

      writer.write({
        ts: Date.now(),
        event: 'console',
        type: 'log',
        url: 'http://test.com',
      });

      await writer.close();

      // Verify file exists and is readable
      expect(fs.existsSync(logFile)).toBe(true);
      const content = fs.readFileSync(logFile, 'utf8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should handle close when already closed', async () => {
      const logFile = path.join(testLogDir, `double-close-${Date.now()}.ndjson`);
      const writer = new LogWriter({
        logFile,
        verbose: false,
      });

      await writer.close();
      await expect(writer.close()).resolves.not.toThrow();
    });
  });
});
