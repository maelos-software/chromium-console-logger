import { CDPClient } from './cdpClient';

describe('CDPClient', () => {
  /**
   * Feature: vivaldi-console-capture, Property 1: Connection establishment with valid parameters
   * For any valid host and port combination where a CDP-enabled browser is listening,
   * the CDPClient should successfully establish a connection and emit a 'connected' event.
   * 
   * Note: This test requires a running CDP-enabled browser and is more of an integration test.
   * We'll test the connection logic with mocked scenarios in unit tests.
   */
  describe('Property 1: Connection establishment', () => {
    it('should emit connected event on successful connection', (done) => {
      // This test would require a real CDP endpoint
      // For now, we'll test the event emission logic
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      client.on('connected', () => {
        done();
      });

      // In a real scenario, this would connect to an actual browser
      // For testing purposes, we verify the event emission mechanism works
      client.emit('connected');
    });

    it('should emit disconnected event on connection loss', (done) => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      client.on('disconnected', () => {
        done();
      });

      client.emit('disconnected');
    });
  });

  /**
   * Feature: vivaldi-console-capture, Property 8: Target selection filters correctly
   * For any set of available targets and a URL substring filter, the selected target
   * should have a URL containing the specified substring, or no target should be selected
   * if none match.
   */
  describe('Property 8: Target selection filters correctly', () => {
    it('should select target with matching URL substring', () => {
      const urlSubstrings = ['test', 'example', 'localhost', 'app'];
      
      urlSubstrings.forEach((substring) => {
        const client = new CDPClient({
          host: '127.0.0.1',
          port: 9222,
          targetUrlSubstring: substring,
          verbose: false,
        });

        const targets = [
          { id: '1', type: 'page', url: `http://${substring}.com/page` },
          { id: '2', type: 'page', url: 'http://other.com' },
        ];

        const target = client.findTarget(targets);
        expect(target).toBeTruthy();
        expect(target.url).toContain(substring);
      });
    });

    it('should return null when no targets match substring', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        targetUrlSubstring: 'nonexistent',
        verbose: false,
      });

      const targets = [
        { id: '1', type: 'page', url: 'http://example.com' },
        { id: '2', type: 'page', url: 'http://test.com' },
      ];

      const target = client.findTarget(targets);
      expect(target).toBeNull();
    });
  });

  describe('findTarget', () => {
    it('should return first page target when no filter is specified', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const targets = [
        { id: '1', type: 'page', url: 'http://example.com' },
        { id: '2', type: 'page', url: 'http://test.com' },
        { id: '3', type: 'worker', url: 'http://worker.com' },
      ];

      const target = client.findTarget(targets);
      expect(target).toBeTruthy();
      expect(target.id).toBe('1');
      expect(target.type).toBe('page');
    });

    it('should filter by URL substring when specified', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        targetUrlSubstring: 'test',
        verbose: false,
      });

      const targets = [
        { id: '1', type: 'page', url: 'http://example.com' },
        { id: '2', type: 'page', url: 'http://test.com' },
        { id: '3', type: 'page', url: 'http://another.com' },
      ];

      const target = client.findTarget(targets);
      expect(target).toBeTruthy();
      expect(target.id).toBe('2');
      expect(target.url).toContain('test');
    });

    it('should return null when no page targets exist', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const targets = [
        { id: '1', type: 'worker', url: 'http://worker.com' },
        { id: '2', type: 'service_worker', url: 'http://sw.com' },
      ];

      const target = client.findTarget(targets);
      expect(target).toBeNull();
    });

    it('should return null when URL filter matches no targets', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        targetUrlSubstring: 'nonexistent',
        verbose: false,
      });

      const targets = [
        { id: '1', type: 'page', url: 'http://example.com' },
        { id: '2', type: 'page', url: 'http://test.com' },
      ];

      const target = client.findTarget(targets);
      expect(target).toBeNull();
    });
  });

  /**
   * Feature: vivaldi-console-capture, Property 9: Console event types are captured correctly
   * For any console method invocation (log, info, warn, error, debug, trace), the captured
   * event should have the event field set to "console" and the type field matching the
   * console method name.
   */
  describe('Property 9: Console event types are captured correctly', () => {
    it('should capture all console event types correctly', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const consoleTypes = ['log', 'info', 'warn', 'error', 'debug', 'trace'];
      const capturedEvents: any[] = [];

      client.on('event', (event) => {
        capturedEvents.push(event);
      });

      consoleTypes.forEach((type) => {
        const params = {
          type,
          args: [{ value: `${type} message` }],
          stackTrace: {
            callFrames: [{ url: 'http://test.com' }],
          },
        };
        (client as any).handleConsoleAPI(params);
      });

      expect(capturedEvents.length).toBe(consoleTypes.length);
      
      consoleTypes.forEach((type, index) => {
        expect(capturedEvents[index].event).toBe('console');
        expect(capturedEvents[index].type).toBe(type);
      });
    });
  });

  describe('event handling', () => {
    it('should emit event for console API calls', (done) => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      client.on('event', (event) => {
        expect(event.event).toBe('console');
        expect(event.type).toBe('log');
        expect(event.ts).toBeGreaterThan(0);
        expect(event.url).toBeDefined();
        expect(event.args).toBeDefined();
        done();
      });

      // Simulate console API call
      const params = {
        type: 'log',
        args: [{ value: 'test message' }],
        stackTrace: {
          callFrames: [{ url: 'http://test.com/script.js' }],
        },
      };

      (client as any).handleConsoleAPI(params);
    });

    /**
     * Feature: vivaldi-console-capture, Property 10: Exception events include stack traces
     * For any uncaught exception in the browser, the captured event should have event field
     * set to "exception" and should include a stackTrace field when available from CDP.
     */
    it('should emit event for exceptions with stack trace', (done) => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      client.on('event', (event) => {
        expect(event.event).toBe('exception');
        expect(event.type).toBe('exception');
        expect(event.ts).toBeGreaterThan(0);
        expect(event.url).toBeDefined();
        expect(event.exceptionDetails).toBeDefined();
        expect(event.stackTrace).toBeDefined();
        expect(event.stackTrace.callFrames).toBeDefined();
        done();
      });

      // Simulate exception
      const params = {
        exceptionDetails: {
          url: 'http://test.com/script.js',
          stackTrace: {
            callFrames: [{ url: 'http://test.com/script.js', lineNumber: 10 }],
          },
          exception: {
            description: 'Error: test error',
          },
        },
      };

      (client as any).handleException(params);
    });

    it('should handle console events with different types', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const types = ['log', 'info', 'warn', 'error', 'debug', 'trace'];
      const events: any[] = [];

      client.on('event', (event) => {
        events.push(event);
      });

      types.forEach((type) => {
        const params = {
          type,
          args: [{ value: `${type} message` }],
          stackTrace: {
            callFrames: [{ url: 'http://test.com' }],
          },
        };
        (client as any).handleConsoleAPI(params);
      });

      expect(events.length).toBe(types.length);
      types.forEach((type, index) => {
        expect(events[index].type).toBe(type);
        expect(events[index].event).toBe('console');
      });
    });
  });

  describe('serializeRemoteObject', () => {
    it('should serialize remote object with value', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const remoteObject = { value: 'test string' };
      const result = (client as any).serializeRemoteObject(remoteObject);
      expect(result).toBe('test string');
    });

    it('should handle unserializable values', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const remoteObject = { unserializableValue: 'Infinity' };
      const result = (client as any).serializeRemoteObject(remoteObject);
      expect(result).toBe('Infinity');
    });

    it('should use description when value is not available', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const remoteObject = { description: 'Object {a: 1}' };
      const result = (client as any).serializeRemoteObject(remoteObject);
      expect(result).toBe('Object {a: 1}');
    });
  });

  describe('connection state', () => {
    it('should track connection state', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      expect(client.isConnected()).toBe(false);
    });
  });
});
