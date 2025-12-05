#!/usr/bin/env node

import { Command } from 'commander';
import CDP from 'chrome-remote-interface';
import { CDPClient } from './cdpClient';
import { LogWriter } from './logWriter';
import { CLIConfig } from './types';

/**
 * Main entry point for the Chromium Console Logger CLI
 */

/**
 * Lists all available browser tabs
 */
async function listAvailableTabs(config: CLIConfig): Promise<void> {
  try {
    console.log(`Connecting to CDP at ${config.host}:${config.port}...`);

    const targets = await CDP.List({
      host: config.host,
      port: config.port,
    });

    const pageTargets = targets.filter((t: any) => t.type === 'page');

    if (pageTargets.length === 0) {
      console.log('No browser tabs found.');
      return;
    }

    console.log(`\nFound ${pageTargets.length} browser tab(s):\n`);

    pageTargets.forEach((tab: any, idx: number) => {
      const index = idx + 1;
      const title = tab.title || '(no title)';
      const url = tab.url;
      console.log(`[${index}] ${title}`);
      console.log(`    URL: ${url}`);
      console.log(`    ID:  ${tab.id}`);
      console.log('');
    });

    console.log('Use --tabs <numbers> to monitor specific tabs (e.g., --tabs 1,2,4)');
  } catch (error: any) {
    console.error(`Failed to list tabs: ${error.message}`);
    process.exit(1);
  }
}

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
  .option('--list-tabs', 'List all available browser tabs and exit', false)
  .option('--tabs <numbers>', 'Monitor only specific tabs by index (comma-separated, e.g., 1,2,4)')
  .option('--target-url-substring <string>', 'Filter targets by URL substring')
  .option('--max-size-bytes <number>', 'Maximum log file size before rotation')
  .option('--rotate-keep <number>', 'Number of rotated files to keep', '5');

program.parse();

const options = program.opts();

// Parse tab indices if provided
let tabIndices: number[] | undefined;
if (options.tabs) {
  tabIndices = options.tabs
    .split(',')
    .map((s: string) => parseInt(s.trim(), 10))
    .filter((n: number) => !isNaN(n) && n > 0);
}

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
  listTabs: options.listTabs,
  tabs: tabIndices,
};

// Main function
async function main() {
  // If list-tabs mode is enabled, list tabs and exit
  if (config.listTabs) {
    await listAvailableTabs(config);
    return;
  }

  // If TUI mode is enabled, start the TUI
  if (options.tui) {
    // @ts-expect-error - Dynamic ESM import
    const tuiModule = await import('./tui-runner.mjs');
    await tuiModule.startTUI(config, CDPClient, LogWriter);
    // TUI handles everything, so we exit here
    return;
  }

  if (config.verbose) {
    console.log('Starting Chromium Console Logger with configuration:');
    console.log(JSON.stringify(config, null, 2));
  }

  // Initialize components
  const cdpClient = new CDPClient({
    host: config.host,
    port: config.port,
    targetUrlSubstring: config.targetUrlSubstring,
    verbose: config.verbose,
    tabIndices: config.tabs,
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
