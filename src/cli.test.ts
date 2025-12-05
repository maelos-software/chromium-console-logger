import { Command } from 'commander';

describe('CLI', () => {
  /**
   * Feature: vivaldi-console-capture, Property: CLI parsing
   * For any valid CLI arguments, the configuration should be parsed correctly.
   */
  describe('CLI argument parsing', () => {
    it('should parse default values correctly', () => {
      const program = new Command();
      
      program
        .option('--host <string>', 'CDP host address', '127.0.0.1')
        .option('--port <number>', 'CDP port number', '9222')
        .option('--log-file <path>', 'Path to log file', 'browser-console.ndjson')
        .option('--include-console <boolean>', 'Include console events', 'true')
        .option('--include-exceptions <boolean>', 'Include exception events', 'true')
        .option('--level <string...>', 'Console levels to capture', [])
        .option('--verbose', 'Enable verbose logging', false)
        .option('--rotate-keep <number>', 'Number of rotated files to keep', '5');

      program.parse(['node', 'test']);
      const options = program.opts();

      expect(options.host).toBe('127.0.0.1');
      expect(options.port).toBe('9222');
      expect(options.logFile).toBe('browser-console.ndjson');
      expect(options.includeConsole).toBe('true');
      expect(options.includeExceptions).toBe('true');
      expect(options.level).toEqual([]);
      expect(options.verbose).toBe(false);
      expect(options.rotateKeep).toBe('5');
    });

    it('should parse custom host and port', () => {
      const program = new Command();
      
      program
        .option('--host <string>', 'CDP host address', '127.0.0.1')
        .option('--port <number>', 'CDP port number', '9222');

      program.parse(['node', 'test', '--host', '192.168.1.1', '--port', '9223']);
      const options = program.opts();

      expect(options.host).toBe('192.168.1.1');
      expect(options.port).toBe('9223');
    });

    it('should parse custom log file path', () => {
      const program = new Command();
      
      program.option('--log-file <path>', 'Path to log file', 'browser-console.ndjson');

      program.parse(['node', 'test', '--log-file', 'logs/custom.ndjson']);
      const options = program.opts();

      expect(options.logFile).toBe('logs/custom.ndjson');
    });

    it('should parse boolean flags', () => {
      const program = new Command();
      
      program
        .option('--include-console <boolean>', 'Include console events', 'true')
        .option('--include-exceptions <boolean>', 'Include exception events', 'true')
        .option('--verbose', 'Enable verbose logging', false);

      program.parse([
        'node',
        'test',
        '--include-console',
        'false',
        '--include-exceptions',
        'false',
        '--verbose',
      ]);
      const options = program.opts();

      expect(options.includeConsole).toBe('false');
      expect(options.includeExceptions).toBe('false');
      expect(options.verbose).toBe(true);
    });

    it('should parse multiple level filters', () => {
      const program = new Command();
      
      program.option('--level <string...>', 'Console levels to capture', []);

      program.parse(['node', 'test', '--level', 'error', '--level', 'warn']);
      const options = program.opts();

      expect(options.level).toEqual(['error', 'warn']);
    });

    it('should parse target URL substring', () => {
      const program = new Command();
      
      program.option('--target-url-substring <string>', 'Filter targets by URL substring');

      program.parse(['node', 'test', '--target-url-substring', 'myapp']);
      const options = program.opts();

      expect(options.targetUrlSubstring).toBe('myapp');
    });

    it('should parse rotation options', () => {
      const program = new Command();
      
      program
        .option('--max-size-bytes <number>', 'Maximum log file size before rotation')
        .option('--rotate-keep <number>', 'Number of rotated files to keep', '5');

      program.parse([
        'node',
        'test',
        '--max-size-bytes',
        '1000000',
        '--rotate-keep',
        '10',
      ]);
      const options = program.opts();

      expect(options.maxSizeBytes).toBe('1000000');
      expect(options.rotateKeep).toBe('10');
    });
  });

  describe('Configuration building', () => {
    it('should build correct configuration from parsed options', () => {
      const options = {
        host: '127.0.0.1',
        port: '9222',
        logFile: 'test.ndjson',
        includeConsole: 'true',
        includeExceptions: 'true',
        level: ['error', 'warn'],
        verbose: true,
        targetUrlSubstring: 'test',
        maxSizeBytes: '5000',
        rotateKeep: '3',
      };

      const config = {
        host: options.host,
        port: parseInt(options.port, 10),
        logFile: options.logFile,
        includeConsole: options.includeConsole === 'true',
        includeExceptions: options.includeExceptions === 'true',
        level: options.level,
        verbose: options.verbose,
        targetUrlSubstring: options.targetUrlSubstring,
        maxSizeBytes: parseInt(options.maxSizeBytes, 10),
        rotateKeep: parseInt(options.rotateKeep, 10),
      };

      expect(config.host).toBe('127.0.0.1');
      expect(config.port).toBe(9222);
      expect(config.logFile).toBe('test.ndjson');
      expect(config.includeConsole).toBe(true);
      expect(config.includeExceptions).toBe(true);
      expect(config.level).toEqual(['error', 'warn']);
      expect(config.verbose).toBe(true);
      expect(config.targetUrlSubstring).toBe('test');
      expect(config.maxSizeBytes).toBe(5000);
      expect(config.rotateKeep).toBe(3);
    });

    it('should handle false boolean values', () => {
      const options = {
        includeConsole: 'false',
        includeExceptions: 'false',
      };

      const config = {
        includeConsole: options.includeConsole === 'true',
        includeExceptions: options.includeExceptions === 'true',
      };

      expect(config.includeConsole).toBe(false);
      expect(config.includeExceptions).toBe(false);
    });
  });
});
