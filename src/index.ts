#!/usr/bin/env node

import { Command } from 'commander';
import { CDPClient } from './cdpClient';
import { LogWriter } from './logWriter';
import { CLIConfig } from './types';

/**
 * Main entry point for the Vivaldi Console Capture CLI
 */

const program = new Command();

program
  .name('chromium-console-logger')
  .description('Capture browser console events and exceptions to NDJSON files via CDP')
  .version('1.0.0')
  .option('--host <string>', 'CDP host address', '127.0.0.1')
  .option('--port <number>', 'CDP port number', '9222')
  .option('--log-file <path>', 'Path to log file', 'browser-console.ndjson')
  .option('--include-console <boolean>', 'Include console events', 'true')
  .option('--include-exceptions <boolean>', 'Include exception events', 'true')
  .option('--level <string...>', 'Console levels to capture (can specify multiple)', [])
  .option('--verbose', 'Enable verbose logging', false)
  .option('--tui', 'Enable Terminal UI mode', false)
  .option('--target-url-substring <string>', 'Filter targets by URL substring')
  .option('--max-size-bytes <number>', 'Maximum log file size before rotation')
  .option('--rotate-keep <number>', 'Number of rotated files to keep', '5');

program.parse();

const options = program.opts();

// Parse configuration
const config: CLIConfig = {
  host: options.host,
  port: parseInt(options.port, 10),
  logFile: options.logFile,
  includeConsole: options.includeConsole === 'true' || options.includeConsole === true,
  includeExceptions: options.includeExceptions === 'true' || options.includeExceptions === true,
  level: Array.isArray(options.level) ? options.level : [],
  verbose: options.verbose,
  targetUrlSubstring: options.targetUrlSubstring,
  maxSizeBytes: options.maxSizeBytes ? parseInt(options.maxSizeBytes, 10) : undefined,
  rotateKeep: parseInt(options.rotateKeep, 10),
};

// Main function
async function main() {
  // If TUI mode is enabled, start the TUI
  if (options.tui) {
    // @ts-ignore - Dynamic ESM import
    const tuiModule = await import('./tui-runner.mjs');
    await tuiModule.startTUI(config, CDPClient, LogWriter);
    // TUI handles everything, so we exit here
    return;
  }

  if (config.verbose) {
    console.log('Starting Vivaldi Console Capture with configuration:');
    console.log(JSON.stringify(config, null, 2));
  }

  // Initialize components
  const cdpClient = new CDPClient({
    host: config.host,
    port: config.port,
    targetUrlSubstring: config.targetUrlSubstring,
    verbose: config.verbose,
  });

  const logWriter = new LogWriter({
    logFile: config.logFile,
    maxSizeBytes: config.maxSizeBytes,
    rotateKeep: config.rotateKeep,
    verbose: config.verbose,
  });

  // Wire event handlers
  cdpClient.on('event', (event) => {
    // Apply filters
    if (event.event === 'console' && !config.includeConsole) {
      return;
    }

    if (event.event === 'exception' && !config.includeExceptions) {
      return;
    }

    // Apply level filter for console events
    if (event.event === 'console' && config.level.length > 0) {
      if (!config.level.includes(event.type)) {
        return;
      }
    }

    // Write event to log
    logWriter.write(event);
  });

  cdpClient.on('connected', () => {
    if (config.verbose) {
      console.log('Connected to browser');
    }
  });

  cdpClient.on('disconnected', () => {
    if (config.verbose) {
      console.log('Disconnected from browser');
    }
  });

  // Handle graceful shutdown
  let shuttingDown = false;

  async function shutdown() {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    if (config.verbose) {
      console.log('\nShutting down gracefully...');
    }

    try {
      // Flush and close log writer
      await logWriter.flush();
      await logWriter.close();

      // Disconnect CDP client
      await cdpClient.disconnect();

      if (config.verbose) {
        console.log('Shutdown complete');
      }

      process.exit(0);
    } catch (error: any) {
      console.error(`Error during shutdown: ${error.message}`);
      process.exit(1);
    }
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start the capture
  try {
    await cdpClient.connect();
  } catch (error: any) {
    console.error(`Failed to start: ${error.message}`);
    process.exit(1);
  }
}

// Run main
main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
