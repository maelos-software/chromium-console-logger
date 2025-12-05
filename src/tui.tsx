import React, { useState, useEffect } from 'react';
import { CDPClient } from './cdpClient.js';
import { LogWriter } from './logWriter.js';
import { CapturedEvent, CLIConfig } from './types.js';

interface Stats {
  totalEvents: number;
  consoleEvents: number;
  exceptionEvents: number;
  byType: Record<string, number>;
  fileSize: number;
  connected: boolean;
}

interface AppProps {
  config: CLIConfig;
}

const App: React.FC<AppProps & { ink: any }> = ({ config, ink }) => {
  const { useApp, useInput, Box, Text } = ink;
  const { exit } = useApp();
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    consoleEvents: 0,
    exceptionEvents: 0,
    byType: {},
    fileSize: 0,
    connected: false,
  });
  const [recentEvents, setRecentEvents] = useState<CapturedEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing...');

  useEffect(() => {
    // Initialize components
    const cdpClient = new CDPClient({
      host: config.host,
      port: config.port,
      targetUrlSubstring: config.targetUrlSubstring,
      verbose: false,
    });

    const logWriter = new LogWriter({
      logFile: config.logFile,
      maxSizeBytes: config.maxSizeBytes,
      rotateKeep: config.rotateKeep,
      verbose: false,
    });

    // Handle events
    cdpClient.on('event', (event: CapturedEvent) => {
      if (paused) return;

      // Apply filters
      if (event.event === 'console' && !config.includeConsole) return;
      if (event.event === 'exception' && !config.includeExceptions) return;
      if (event.event === 'console' && config.level.length > 0) {
        if (!config.level.includes(event.type)) return;
      }

      // Write to log
      logWriter.write(event);

      // Update stats
      setStats((prev) => {
        const newStats = { ...prev };
        newStats.totalEvents++;
        if (event.event === 'console') newStats.consoleEvents++;
        if (event.event === 'exception') newStats.exceptionEvents++;
        newStats.byType[event.type] = (newStats.byType[event.type] || 0) + 1;
        return newStats;
      });

      // Update recent events (keep last 10)
      setRecentEvents((prev) => {
        const updated = [event, ...prev].slice(0, 10);
        return updated;
      });
    });

    cdpClient.on('connected', () => {
      setStats((prev) => ({ ...prev, connected: true }));
      setStatusMessage('Connected to browser');
    });

    cdpClient.on('disconnected', () => {
      setStats((prev) => ({ ...prev, connected: false }));
      setStatusMessage('Disconnected - reconnecting...');
    });

    // Connect
    cdpClient.connect().catch((err) => {
      setStatusMessage(`Error: ${err.message}`);
    });

    // Cleanup
    return () => {
      cdpClient.disconnect();
      logWriter.flush();
      logWriter.close();
    };
  }, [config, paused]);

  useInput((input: string, key: any) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
    } else if (input === 'p') {
      setPaused((prev) => !prev);
    } else if (input === 'c') {
      setRecentEvents([]);
    }
  });

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString();
  };

  const formatEvent = (event: CapturedEvent) => {
    const time = formatTimestamp(event.ts);
    const typeColor =
      event.type === 'error' || event.event === 'exception'
        ? 'red'
        : event.type === 'warn'
          ? 'yellow'
          : event.type === 'info'
            ? 'blue'
            : 'green';

    const typeLabel = event.type.toUpperCase().padEnd(9);
    const url = event.url.length > 50 ? '...' + event.url.slice(-47) : event.url;

    let message = '';
    if (event.event === 'console' && event.args) {
      message = event.args
        .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ');
      if (message.length > 60) message = message.slice(0, 57) + '...';
    } else if (event.event === 'exception' && event.exceptionDetails) {
      const desc = event.exceptionDetails.exception?.description || 'Exception';
      message = desc.split('\n')[0];
      if (message.length > 60) message = message.slice(0, 57) + '...';
    }

    return { time, typeColor, typeLabel, url, message };
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
        <Box flexDirection="column" width="100%">
          <Text bold color="cyan">
            🎯 Chromium Console Logger
          </Text>
          <Box marginTop={1}>
            <Text>
              Status:{' '}
              <Text color={stats.connected ? 'green' : 'red'}>
                {stats.connected ? '● Connected' : '○ Disconnected'}
              </Text>
              {'  '}| Events: <Text color="cyan">{stats.totalEvents}</Text>
              {'  '}| File: <Text color="yellow">{config.logFile}</Text>
            </Text>
          </Box>
          {statusMessage && (
            <Box marginTop={1}>
              <Text dimColor>{statusMessage}</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Stats */}
      <Box marginTop={1} borderStyle="round" borderColor="gray" paddingX={2} paddingY={1}>
        <Box flexDirection="column" width="100%">
          <Box>
            <Text>
              Console: <Text color="green">{stats.consoleEvents}</Text>
              {'  '}| Exceptions: <Text color="red">{stats.exceptionEvents}</Text>
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>
              {Object.entries(stats.byType)
                .map(([type, count]) => `${type}: ${count}`)
                .join('  |  ')}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Events */}
      <Box
        marginTop={1}
        borderStyle="round"
        borderColor="gray"
        paddingX={2}
        paddingY={1}
        flexDirection="column"
        height={15}
      >
        <Text bold>Recent Events {paused && <Text color="yellow">[PAUSED]</Text>}</Text>
        <Box marginTop={1} flexDirection="column">
          {recentEvents.length === 0 ? (
            <Text dimColor>Waiting for events...</Text>
          ) : (
            recentEvents.map((event, idx) => {
              const { time, typeColor, typeLabel, url, message } = formatEvent(event);
              return (
                <Box key={idx} marginBottom={idx < recentEvents.length - 1 ? 1 : 0}>
                  <Text dimColor>{time}</Text>
                  <Text> </Text>
                  <Text color={typeColor}>[{typeLabel}]</Text>
                  <Text> </Text>
                  <Text>{message}</Text>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* Controls */}
      <Box marginTop={1} borderStyle="round" borderColor="gray" paddingX={2} paddingY={1}>
        <Text>
          <Text bold color="cyan">
            [q]
          </Text>{' '}
          Quit {'  '}
          <Text bold color="cyan">
            [p]
          </Text>{' '}
          {paused ? 'Resume' : 'Pause'} {'  '}
          <Text bold color="cyan">
            [c]
          </Text>{' '}
          Clear
        </Text>
      </Box>
    </Box>
  );
};

export async function startTUI(config: CLIConfig) {
  // Dynamically import ink to handle ESM
  const ink = await import('ink');
  const { render } = ink;
  render(<App config={config} ink={ink} />);
}
