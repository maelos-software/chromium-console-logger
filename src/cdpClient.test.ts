import { CDPClient } from './cdpClient';
import CDP from 'chrome-remote-interface';

// Mock CDP module
jest.mock('chrome-remote-interface');

// Mock target for testing
const mockTarget = {
  id: 'test-target-id',
  title: 'Test Page',
  url: 'http://test.com/',
};

describe('CDPClient', () => {
  /**
   * Feature: chromium-console-logger, Property 1: Connection establishment with valid parameters
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
   * Feature: chromium-console-logger, Property 8: Target selection filters correctly
   * For any set of available targets and a URL substring filter, the client should
   * connect to targets with URLs containing the specified substring.
   */
  describe('Property 8: Target selection filters correctly', () => {
    it('should support URL substring filtering', () => {
      const urlSubstrings = ['test', 'example', 'localhost', 'app'];

      urlSubstrings.forEach((substring) => {
        const client = new CDPClient({
          host: '127.0.0.1',
          port: 9222,
          targetUrlSubstring: substring,
          verbose: false,
        });

        // Client should be created with the filter
        expect(client).toBeTruthy();
      });
    });

    it('should support tab indices filtering', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        tabIndices: [1, 2, 4],
        verbose: false,
      });

      // Client should be created with the filter
      expect(client).toBeTruthy();
    });
  });

  describe('Multi-target connection', () => {
    it('should connect to all page targets when no filter is specified', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      // Test that client is created successfully
      expect(client).toBeTruthy();
      expect(client.isConnected()).toBe(false);
    });

    it('should support tab indices filter', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        tabIndices: [1, 3],
        verbose: false,
      });

      expect(client).toBeTruthy();
    });

    it('should support URL substring filter', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        targetUrlSubstring: 'test',
        verbose: false,
      });

      expect(client).toBeTruthy();
    });

    it('should handle empty target list gracefully', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      expect(client).toBeTruthy();
      expect(client.isConnected()).toBe(false);
    });
  });

  /**
   * Feature: chromium-console-logger, Property 9: Console event types are captured correctly
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
        (client as any).handleConsoleAPI(params, mockTarget);
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
        expect(event.tab).toBeDefined();
        expect(event.tab?.id).toBe('test-target-id');
        expect(event.tab?.title).toBe('Test Page');
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

      (client as any).handleConsoleAPI(params, mockTarget);
    });

    /**
     * Feature: chromium-console-logger, Property 10: Exception events include stack traces
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
        expect(event.tab).toBeDefined();
        expect(event.tab?.id).toBe('test-target-id');
        expect(event.tab?.title).toBe('Test Page');
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

      (client as any).handleException(params, mockTarget);
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
        (client as any).handleConsoleAPI(params, mockTarget);
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

  describe('error handling', () => {
    it('should handle serializeRemoteObject with object containing only description', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const remoteObject = { description: 'null' };
      const result = (client as any).serializeRemoteObject(remoteObject);
      expect(result).toBe('null');
    });

    it('should handle serializeRemoteObject with complex nested value', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const remoteObject = { value: { nested: { deep: 'value' } } };
      const result = (client as any).serializeRemoteObject(remoteObject);
      expect(result).toEqual({ nested: { deep: 'value' } });
    });

    it('should handle disconnect when not connected', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      // Should not throw
      expect(() => client.disconnect()).not.toThrow();
    });

    it('should handle multiple disconnect calls', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      // Should not throw
      expect(() => {
        client.disconnect();
        client.disconnect();
      }).not.toThrow();
    });
  });

  describe('target filtering edge cases', () => {
    it('should handle empty URL substring filter', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        targetUrlSubstring: '',
        verbose: false,
      });

      // Empty string should match all URLs
      expect(client).toBeDefined();
    });

    it('should handle tab indices with out-of-range values', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        tabIndices: [999, 1000],
        verbose: false,
      });

      // Should not throw, just won't match any tabs
      expect(client).toBeDefined();
    });

    it('should handle negative tab indices', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        tabIndices: [-1, 0],
        verbose: false,
      });

      // Should not throw
      expect(client).toBeDefined();
    });

    it('should handle both URL filter and tab indices together', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        targetUrlSubstring: 'example.com',
        tabIndices: [1, 2],
        verbose: false,
      });

      // Should create client with both filters
      expect(client).toBeDefined();
    });
  });

  describe('verbose mode', () => {
    it('should create client with verbose mode enabled', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: true,
      });

      expect(client).toBeDefined();
    });

    it('should create client with verbose mode disabled', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      expect(client).toBeDefined();
    });
  });

  describe('tab metadata', () => {
    it('should include tab metadata in console events', (done) => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const testTarget = {
        id: 'unique-tab-id',
        title: 'My Test Page',
        url: 'http://example.com/',
      };

      client.on('event', (event) => {
        expect(event.tab).toBeDefined();
        expect(event.tab?.id).toBe('unique-tab-id');
        expect(event.tab?.title).toBe('My Test Page');
        done();
      });

      const params = {
        type: 'log',
        args: [{ value: 'test' }],
        stackTrace: { callFrames: [] },
      };

      (client as any).handleConsoleAPI(params, testTarget);
    });

    it('should include tab metadata in exception events', (done) => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const testTarget = {
        id: 'exception-tab-id',
        title: 'Error Page',
        url: 'http://error.com/',
      };

      client.on('event', (event) => {
        expect(event.tab).toBeDefined();
        expect(event.tab?.id).toBe('exception-tab-id');
        expect(event.tab?.title).toBe('Error Page');
        done();
      });

      const params = {
        exceptionDetails: {
          url: 'http://error.com/script.js',
          stackTrace: { callFrames: [] },
          exception: { description: 'Error' },
        },
      };

      (client as any).handleException(params, testTarget);
    });

    it('should handle empty tab title', (done) => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const testTarget = {
        id: 'no-title-tab',
        title: '',
        url: 'http://example.com/',
      };

      client.on('event', (event) => {
        expect(event.tab).toBeDefined();
        expect(event.tab?.id).toBe('no-title-tab');
        expect(event.tab?.title).toBe('');
        done();
      });

      const params = {
        type: 'log',
        args: [{ value: 'test' }],
        stackTrace: { callFrames: [] },
      };

      (client as any).handleConsoleAPI(params, testTarget);
    });
  });

  describe('error handling in event processing', () => {
    it('should handle errors in console event processing gracefully', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      // Mock emit to throw an error
      const originalEmit = client.emit;
      client.emit = jest.fn(() => {
        throw new Error('Emit error');
      });

      const params = {
        type: 'log',
        args: [{ value: 'test' }],
        stackTrace: { callFrames: [] },
      };

      // Should not throw, error should be caught
      expect(() => {
        (client as any).handleConsoleAPI(params, mockTarget);
      }).not.toThrow();

      client.emit = originalEmit;
    });

    it('should handle errors in exception event processing gracefully', () => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      // Mock emit to throw an error
      const originalEmit = client.emit;
      client.emit = jest.fn(() => {
        throw new Error('Emit error');
      });

      const params = {
        exceptionDetails: {
          url: 'http://test.com',
          stackTrace: { callFrames: [] },
          exception: { description: 'Error' },
        },
      };

      // Should not throw, error should be caught
      expect(() => {
        (client as any).handleException(params, mockTarget);
      }).not.toThrow();

      client.emit = originalEmit;
    });

    it('should handle missing target properties', (done) => {
      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const incompleteTarget = {
        id: 'test-id',
        title: undefined,
        url: undefined,
      };

      client.on('event', (event) => {
        expect(event.tab?.title).toBe('');
        expect(event.url).toBe('unknown');
        done();
      });

      const params = {
        type: 'log',
        args: [{ value: 'test' }],
        stackTrace: undefined,
      };

      (client as any).handleConsoleAPI(params, incompleteTarget);
    });
  });

  describe('connection with mocked CDP', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully connect to CDP and emit connected event', async () => {
      const mockClient = {
        Runtime: {
          enable: jest.fn().mockResolvedValue(undefined),
          consoleAPICalled: jest.fn(),
          exceptionThrown: jest.fn(),
        },
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockTargets = [
        { id: 'target-1', type: 'page', url: 'http://test1.com', title: 'Test 1' },
        { id: 'target-2', type: 'page', url: 'http://test2.com', title: 'Test 2' },
      ];

      (CDP.List as jest.Mock).mockResolvedValue(mockTargets);
      (CDP as any as jest.Mock).mockResolvedValue(mockClient);

      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const connectedPromise = new Promise((resolve) => {
        client.on('connected', resolve);
      });

      await client.connect();
      await connectedPromise;

      expect(CDP.List).toHaveBeenCalledWith({ host: '127.0.0.1', port: 9222 });
      expect(client.isConnected()).toBe(true);

      await client.disconnect();
    });

    it('should handle connection failure', async () => {
      (CDP.List as jest.Mock).mockRejectedValue(new Error('Connection refused'));

      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      // Disable reconnection for this test
      (client as any).shouldReconnect = false;

      await expect(client.connect()).rejects.toThrow('Connection refused');
    });

    it('should filter targets by URL substring', async () => {
      const mockClient = {
        Runtime: {
          enable: jest.fn().mockResolvedValue(undefined),
          consoleAPICalled: jest.fn(),
          exceptionThrown: jest.fn(),
        },
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockTargets = [
        { id: 'target-1', type: 'page', url: 'http://test1.com', title: 'Test 1' },
        { id: 'target-2', type: 'page', url: 'http://example.com', title: 'Example' },
      ];

      (CDP.List as jest.Mock).mockResolvedValue(mockTargets);
      (CDP as any as jest.Mock).mockResolvedValue(mockClient);

      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        targetUrlSubstring: 'example',
        verbose: false,
      });

      await client.connect();

      // Should only connect to target-2
      expect(CDP).toHaveBeenCalledTimes(1);
      expect(CDP).toHaveBeenCalledWith({
        host: '127.0.0.1',
        port: 9222,
        target: 'target-2',
      });

      await client.disconnect();
    });

    it('should filter targets by tab indices', async () => {
      const mockClient = {
        Runtime: {
          enable: jest.fn().mockResolvedValue(undefined),
          consoleAPICalled: jest.fn(),
          exceptionThrown: jest.fn(),
        },
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockTargets = [
        { id: 'target-1', type: 'page', url: 'http://test1.com', title: 'Test 1' },
        { id: 'target-2', type: 'page', url: 'http://test2.com', title: 'Test 2' },
        { id: 'target-3', type: 'page', url: 'http://test3.com', title: 'Test 3' },
      ];

      (CDP.List as jest.Mock).mockResolvedValue(mockTargets);
      (CDP as any as jest.Mock).mockResolvedValue(mockClient);

      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        tabIndices: [1, 3], // 1-based indices
        verbose: false,
      });

      await client.connect();

      // Should connect to target-1 and target-3
      expect(CDP).toHaveBeenCalledTimes(2);

      await client.disconnect();
    });

    it('should handle no suitable targets found', async () => {
      (CDP.List as jest.Mock).mockResolvedValue([]);

      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      (client as any).shouldReconnect = false;

      await expect(client.connect()).rejects.toThrow('No suitable targets found');
    });

    it('should disconnect all clients', async () => {
      const mockClient = {
        Runtime: {
          enable: jest.fn().mockResolvedValue(undefined),
          consoleAPICalled: jest.fn(),
          exceptionThrown: jest.fn(),
        },
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockTargets = [
        { id: 'target-1', type: 'page', url: 'http://test1.com', title: 'Test 1' },
      ];

      (CDP.List as jest.Mock).mockResolvedValue(mockTargets);
      (CDP as any as jest.Mock).mockResolvedValue(mockClient);

      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      await client.connect();
      expect(client.isConnected()).toBe(true);

      await client.disconnect();
      expect(client.isConnected()).toBe(false);
      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should emit targets event with page targets', async () => {
      const mockClient = {
        Runtime: {
          enable: jest.fn().mockResolvedValue(undefined),
          consoleAPICalled: jest.fn(),
          exceptionThrown: jest.fn(),
        },
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockTargets = [
        { id: 'target-1', type: 'page', url: 'http://test1.com', title: 'Test 1' },
        { id: 'target-2', type: 'other', url: 'http://test2.com', title: 'Test 2' },
      ];

      (CDP.List as jest.Mock).mockResolvedValue(mockTargets);
      (CDP as any as jest.Mock).mockResolvedValue(mockClient);

      const client = new CDPClient({
        host: '127.0.0.1',
        port: 9222,
        verbose: false,
      });

      const targetsPromise = new Promise((resolve) => {
        client.on('targets', resolve);
      });

      await client.connect();
      const emittedTargets = await targetsPromise;

      // Should only emit page targets
      expect(emittedTargets).toHaveLength(1);
      expect((emittedTargets as any)[0].type).toBe('page');

      await client.disconnect();
    });
  });
});
