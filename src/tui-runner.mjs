import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';

export async function startTUI(config, CDPClient, LogWriter) {
  const App = () => {
    const { exit } = useApp();
    const [stats, setStats] = useState({
      totalEvents: 0,
      consoleEvents: 0,
      exceptionEvents: 0,
      byType: {},
      fileSize: 0,
      connected: false,
    });
    const [tabs, setTabs] = useState([]);
    const [selectedTabId, setSelectedTabId] = useState(null); // null = all tabs
    const [highlightedTabIndex, setHighlightedTabIndex] = useState(-1); // -1 = "All Tabs", 0+ = tab index
    const [recentEvents, setRecentEvents] = useState([]);
    const [paused, setPaused] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Initializing...');
    const [scrollOffset, setScrollOffset] = useState(0);
    const [viewMode, setViewMode] = useState('events'); // 'events' or 'tabs'
    const [terminalSize, setTerminalSize] = useState({
      rows: process.stdout.rows || 24,
      columns: process.stdout.columns || 80,
    });

    useEffect(() => {
      // Track terminal resize
      const handleResize = () => {
        setTerminalSize({
          rows: process.stdout.rows || 24,
          columns: process.stdout.columns || 80,
        });
      };

      process.stdout.on('resize', handleResize);

      // Initialize components
      const cdpClient = new CDPClient({
        host: config.host,
        port: config.port,
        targetUrlSubstring: config.targetUrlSubstring,
        verbose: false,
        tabIndices: config.tabs,
      });

      const logWriter = new LogWriter({
        logFile: config.logFile,
        maxSizeBytes: config.maxSizeBytes,
        rotateKeep: config.rotateKeep,
        verbose: false,
      });

      // Handle events
      cdpClient.on('event', (event) => {
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

        // Update recent events (keep last 100)
        setRecentEvents((prev) => {
          const updated = [event, ...prev].slice(0, 100);
          return updated;
        });

        // Reset scroll when new events arrive
        setScrollOffset(0);
      });

      cdpClient.on('connected', () => {
        setStats((prev) => ({ ...prev, connected: true }));
        setStatusMessage('Connected to browser');
      });

      cdpClient.on('disconnected', () => {
        setStats((prev) => ({ ...prev, connected: false }));
        setStatusMessage('Disconnected - reconnecting...');
      });

      cdpClient.on('targets', (targetList) => {
        setTabs(targetList);
      });

      // Connect
      cdpClient.connect().catch((err) => {
        setStatusMessage(`Error: ${err.message}`);
      });

      // Cleanup
      return () => {
        process.stdout.off('resize', handleResize);
        cdpClient.disconnect();
        logWriter.flush();
        logWriter.close();
      };
    }, [paused]);

    useInput((input, key) => {
      if (input === 'q' || (key.ctrl && input === 'c')) {
        exit();
      } else if (input === 'p') {
        setPaused((prev) => !prev);
      } else if (input === 'c') {
        setRecentEvents([]);
        setScrollOffset(0);
      } else if (input === 't') {
        // Toggle between tabs view and events view
        setViewMode((prev) => (prev === 'events' ? 'tabs' : 'events'));
        if (viewMode === 'events') {
          setHighlightedTabIndex(-1); // Start at "All Tabs"
        }
      } else if (input === 'a') {
        setSelectedTabId(null); // Show all tabs
        setHighlightedTabIndex(-1);
      } else if (input >= '1' && input <= '9') {
        const idx = parseInt(input) - 1;
        if (idx < tabs.length) {
          setSelectedTabId(tabs[idx].id);
          setHighlightedTabIndex(idx);
        }
      } else if (key.upArrow) {
        if (viewMode === 'tabs') {
          // Navigate tabs list
          setHighlightedTabIndex((prev) => Math.max(-1, prev - 1));
        } else {
          // Scroll events
          setScrollOffset((prev) => Math.max(0, prev - 1));
        }
      } else if (key.downArrow) {
        if (viewMode === 'tabs') {
          // Navigate tabs list
          setHighlightedTabIndex((prev) => Math.min(tabs.length - 1, prev + 1));
        } else {
          // Scroll events
          setScrollOffset((prev) => Math.min(recentEvents.length - 1, prev + 1));
        }
      } else if (key.return && viewMode === 'tabs') {
        // Select highlighted tab
        if (highlightedTabIndex === -1) {
          setSelectedTabId(null); // All tabs
        } else if (highlightedTabIndex >= 0 && highlightedTabIndex < tabs.length) {
          setSelectedTabId(tabs[highlightedTabIndex].id);
        }
        setViewMode('events'); // Switch back to events view
      }
    });

    const formatTimestamp = (ts) => {
      const date = new Date(ts);
      return date.toLocaleTimeString();
    };

    const truncateText = (text, maxLen) => {
      if (text.length <= maxLen) return text;
      return text.slice(0, maxLen - 3) + '...';
    };

    const formatEvent = (event, terminalWidth) => {
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
      
      // Calculate available width for message
      const usedWidth = time.length + typeLabel.length + 6; // 6 for spacing and brackets
      const availableWidth = Math.max(40, terminalWidth - usedWidth - 10);
      const messageWidth = availableWidth;

      let message = '';
      if (event.event === 'console' && event.args) {
        message = event.args
          .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
          .join(' ');
      } else if (event.event === 'exception' && event.exceptionDetails) {
        const desc = event.exceptionDetails.exception?.description || 'Exception';
        message = desc.split('\n')[0];
      }
      message = truncateText(message, messageWidth);

      return { time, typeColor, typeLabel, message };
    };

    // Filter events by selected tab
    const filteredEvents = selectedTabId
      ? recentEvents.filter((e) => {
          const tab = tabs.find((t) => t.id === selectedTabId);
          return tab && e.url.includes(tab.url);
        })
      : recentEvents;

    // Calculate visible events based on terminal height
    // Header (5 lines) + Tabs panel (3 + num tabs) + Controls (3) + borders/margins
    const tabsPanelHeight = Math.min(tabs.length + 3, 13); // Cap at 13 lines
    const fixedHeight = 5 + tabsPanelHeight + 3 + 6; // borders and margins
    const maxVisibleEvents = Math.max(5, terminalSize.rows - fixedHeight);
    const visibleEvents = filteredEvents.slice(scrollOffset, scrollOffset + maxVisibleEvents);

    return (
      <Box flexDirection="column" width="100%" height="100%">
        {/* Header */}
        <Box borderStyle="round" borderColor="cyan" paddingX={1}>
          <Box flexDirection="column" width="100%">
            <Text bold color="cyan">
              🎯 Chromium Console Logger
            </Text>
            <Text>
              Status:{' '}
              <Text color={stats.connected ? 'green' : 'red'}>
                {stats.connected ? '● Connected' : '○ Disconnected'}
              </Text>
              {' | '}Events: <Text color="cyan">{stats.totalEvents}</Text>
              {' | '}Console: <Text color="green">{stats.consoleEvents}</Text>
              {' | '}Exceptions: <Text color="red">{stats.exceptionEvents}</Text>
            </Text>
            {statusMessage && <Text dimColor>{statusMessage}</Text>}
          </Box>
        </Box>

        {/* Tabs Panel */}
        <Box
          marginTop={1}
          borderStyle="round"
          borderColor={viewMode === 'tabs' ? 'yellow' : 'magenta'}
          paddingX={1}
        >
          <Box flexDirection="column" width="100%">
            <Text bold color={viewMode === 'tabs' ? 'yellow' : 'magenta'}>
              Monitored Tabs ({tabs.length}) {viewMode === 'tabs' && '← NAVIGATION MODE'}
            </Text>
            {tabs.length === 0 ? (
              <Text dimColor>No tabs detected</Text>
            ) : (
              <Box flexDirection="column">
                <Text
                  backgroundColor={viewMode === 'tabs' && highlightedTabIndex === -1 ? 'blue' : undefined}
                >
                  <Text bold color={selectedTabId === null ? 'cyan' : 'gray'}>
                    [a]
                  </Text>{' '}
                  All Tabs
                </Text>
                {tabs.slice(0, 9).map((tab, idx) => {
                  const isSelected = selectedTabId === tab.id;
                  const isHighlighted = viewMode === 'tabs' && highlightedTabIndex === idx;
                  const title = truncateText(tab.title || tab.url, terminalSize.columns - 20);
                  return (
                    <Text key={tab.id} backgroundColor={isHighlighted ? 'blue' : undefined}>
                      <Text bold color={isSelected ? 'cyan' : 'gray'}>
                        [{idx + 1}]
                      </Text>{' '}
                      {title}
                    </Text>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>

        {/* Events */}
        <Box
          marginTop={1}
          borderStyle="round"
          borderColor="gray"
          paddingX={1}
          flexGrow={1}
          minHeight={maxVisibleEvents + 2}
        >
          <Box flexDirection="column" width="100%">
            <Text bold>
              Events {paused && <Text color="yellow">[PAUSED]</Text>}
              {selectedTabId && <Text color="cyan"> [Filtered]</Text>}
              {filteredEvents.length > maxVisibleEvents && (
                <Text dimColor>
                  {' '}
                  ({scrollOffset + 1}-{Math.min(scrollOffset + maxVisibleEvents, filteredEvents.length)}/
                  {filteredEvents.length})
                </Text>
              )}
            </Text>
            {filteredEvents.length === 0 ? (
              <Text dimColor>Waiting for events...</Text>
            ) : (
              visibleEvents.map((event, idx) => {
                const { time, typeColor, typeLabel, message } = formatEvent(event, terminalSize.columns);
                return (
                  <Box key={scrollOffset + idx}>
                    <Text dimColor>{time}</Text>
                    <Text> </Text>
                    <Text color={typeColor}>[{typeLabel}]</Text>
                    <Text> {message}</Text>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* Controls */}
        <Box borderStyle="round" borderColor="gray" paddingX={1}>
          <Text>
            <Text bold color="cyan">
              [q]
            </Text>{' '}
            Quit{' '}
            <Text bold color="cyan">
              [p]
            </Text>{' '}
            {paused ? 'Resume' : 'Pause'}{' '}
            <Text bold color="cyan">
              [c]
            </Text>{' '}
            Clear{' '}
            <Text bold color="cyan">
              [t]
            </Text>{' '}
            Tab Nav{' '}
            <Text bold color="cyan">
              [a]
            </Text>{' '}
            All{' '}
            <Text bold color="cyan">
              [1-9]
            </Text>{' '}
            Select{' '}
            <Text bold color="cyan">
              [↑↓]
            </Text>{' '}
            {viewMode === 'tabs' ? 'Navigate' : 'Scroll'}{' '}
            {viewMode === 'tabs' && (
              <>
                <Text bold color="cyan">
                  [Enter]
                </Text>{' '}
                Confirm
              </>
            )}
          </Text>
        </Box>
      </Box>
    );
  };

  const { unmount, waitUntilExit } = render(<App />);
  
  // Return cleanup function
  return { unmount, waitUntilExit };
}
