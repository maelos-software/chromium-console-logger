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
    const [tabScrollOffset, setTabScrollOffset] = useState(0); // For scrolling through many tabs
    const [recentEvents, setRecentEvents] = useState([]);
    const [paused, setPaused] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Initializing...');
    const [scrollOffset, setScrollOffset] = useState(0);
    const [viewMode, setViewMode] = useState('events'); // 'events' or 'tabs'
    const [logLevelFilter, setLogLevelFilter] = useState([]); // Runtime log level filter
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

        // Write to log (always write, regardless of runtime filter)
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

        // Update recent events (keep last 200 for better scrolling)
        setRecentEvents((prev) => {
          const updated = [event, ...prev].slice(0, 200);
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
      } else if (input === 'l') {
        // Cycle through log level filters: all -> error -> warn -> info -> debug -> all
        setLogLevelFilter((prev) => {
          if (prev.length === 0) return ['error'];
          if (prev[0] === 'error') return ['error', 'warn'];
          if (prev.length === 2 && prev[1] === 'warn') return ['error', 'warn', 'info'];
          if (prev.length === 3) return ['error', 'warn', 'info', 'debug'];
          return []; // Back to all
        });
      } else if (input >= '1' && input <= '9') {
        const idx = parseInt(input) - 1;
        if (idx < tabs.length) {
          setSelectedTabId(tabs[idx].id);
          setHighlightedTabIndex(idx);
        }
      } else if (key.upArrow) {
        if (viewMode === 'tabs') {
          // Navigate tabs list
          const newIndex = Math.max(-1, highlightedTabIndex - 1);
          setHighlightedTabIndex(newIndex);
          // Adjust scroll if needed
          if (newIndex < tabScrollOffset) {
            setTabScrollOffset(Math.max(0, newIndex));
          }
        } else {
          // Scroll events
          setScrollOffset((prev) => Math.max(0, prev - 1));
        }
      } else if (key.downArrow) {
        if (viewMode === 'tabs') {
          // Navigate tabs list
          const newIndex = Math.min(tabs.length - 1, highlightedTabIndex + 1);
          setHighlightedTabIndex(newIndex);
          // Adjust scroll if needed (show max 6 tabs)
          if (newIndex >= tabScrollOffset + 6) {
            setTabScrollOffset(newIndex - 5);
          }
        } else {
          // Scroll events
          setScrollOffset((prev) => Math.min(recentEvents.length - 1, prev + 1));
        }
      } else if (key.pageUp) {
        // Page up - scroll events by 10
        setScrollOffset((prev) => Math.max(0, prev - 10));
      } else if (key.pageDown) {
        // Page down - scroll events by 10
        setScrollOffset((prev) => Math.min(recentEvents.length - 1, prev + 10));
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
      
      // Find which tab this event came from
      let tabNumber = null;
      let tabColor = 'gray';
      if (event.url && event.url !== 'unknown') {
        // Try to match by URL - check if event URL starts with tab URL or vice versa
        const tabIndex = tabs.findIndex((tab) => {
          if (!tab.url) return false;
          // Extract domain/origin for comparison
          try {
            const eventUrlObj = new URL(event.url);
            const tabUrlObj = new URL(tab.url);
            // Match by origin (protocol + host)
            return eventUrlObj.origin === tabUrlObj.origin;
          } catch {
            // Fallback to simple string matching
            return event.url.includes(tab.url) || tab.url.includes(event.url);
          }
        });
        
        if (tabIndex !== -1) {
          tabNumber = tabIndex + 1;
          // Use different colors for different tabs
          const colors = ['cyan', 'magenta', 'yellow', 'green', 'blue', 'red', 'white'];
          tabColor = colors[tabIndex % colors.length];
        }
      }
      
      const tabLabel = tabNumber ? `[T${tabNumber}]` : '[T?]';
      
      // Calculate available width for message
      const usedWidth = time.length + tabLabel.length + typeLabel.length + 8; // 8 for spacing and brackets
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

      return { time, typeColor, typeLabel, message, tabLabel, tabColor };
    };

    // Filter events by selected tab and log level
    let filteredEvents = recentEvents;
    
    // Filter by tab
    if (selectedTabId) {
      filteredEvents = filteredEvents.filter((e) => {
        const tab = tabs.find((t) => t.id === selectedTabId);
        return tab && e.url.includes(tab.url);
      });
    }
    
    // Filter by log level (runtime filter for display only)
    if (logLevelFilter.length > 0) {
      filteredEvents = filteredEvents.filter((e) => {
        if (e.event === 'exception') return logLevelFilter.includes('error');
        return logLevelFilter.includes(e.type);
      });
    }

    // Calculate visible events based on terminal height
    // Each component's height in lines:
    // Header: 6 lines (border + title + status + logfile + message + border)
    // Tabs panel: 4 + visible tabs (border + title + "All Tabs" + tabs + border), max 6 tabs shown
    // Controls: 4 lines (border + 2 lines of text + border)
    // Margins: 2 (between components)
    const maxVisibleTabCount = 6;
    const visibleTabCount = Math.min(tabs.length, maxVisibleTabCount);
    const tabsPanelHeight = tabs.length === 0 ? 4 : 4 + visibleTabCount;
    const headerHeight = 6;
    const controlsHeight = 4;
    const margins = 2;
    const fixedHeight = headerHeight + tabsPanelHeight + controlsHeight + margins;
    
    // Events panel gets remaining space (minus 2 for its own borders)
    const eventsPanelInnerHeight = Math.max(3, terminalSize.rows - fixedHeight - 2);
    const maxVisibleEvents = eventsPanelInnerHeight - 1; // -1 for the "Events" header line
    const visibleEvents = filteredEvents.slice(scrollOffset, scrollOffset + maxVisibleEvents);
    
    // Get visible tabs with scrolling
    const visibleTabs = tabs.slice(tabScrollOffset, tabScrollOffset + maxVisibleTabCount);

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
            <Text dimColor>
              Log: <Text color="yellow">{config.logFile}</Text>
              {logLevelFilter.length > 0 && (
                <>
                  {' | '}Filter: <Text color="magenta">{logLevelFilter.join(', ')}</Text>
                </>
              )}
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
          height={tabsPanelHeight}
          overflow="hidden"
        >
          <Box flexDirection="column" width="100%">
            <Text bold color={viewMode === 'tabs' ? 'yellow' : 'magenta'}>
              Monitored Tabs ({tabs.length})
              {tabs.length > maxVisibleTabCount && ` [${tabScrollOffset + 1}-${Math.min(tabScrollOffset + maxVisibleTabCount, tabs.length)}]`}
              {viewMode === 'tabs' && ' ← NAV MODE'}
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
                {visibleTabs.map((tab, visibleIdx) => {
                  const actualIdx = tabScrollOffset + visibleIdx;
                  const isSelected = selectedTabId === tab.id;
                  const isHighlighted = viewMode === 'tabs' && highlightedTabIndex === actualIdx;
                  const title = truncateText(tab.title || tab.url, terminalSize.columns - 20);
                  return (
                    <Text key={tab.id} backgroundColor={isHighlighted ? 'blue' : undefined}>
                      <Text bold color={isSelected ? 'cyan' : 'gray'}>
                        [{actualIdx + 1}]
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
          height={eventsPanelInnerHeight + 2}
          overflow="hidden"
        >
          <Box flexDirection="column" width="100%" height={eventsPanelInnerHeight}>
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
                const { time, typeColor, typeLabel, message, tabLabel, tabColor } = formatEvent(
                  event,
                  terminalSize.columns
                );
                return (
                  <Box key={scrollOffset + idx}>
                    <Text dimColor>{time}</Text>
                    <Text> </Text>
                    <Text color={tabColor}>{tabLabel}</Text>
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
          <Box flexDirection="column">
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
                [l]
              </Text>{' '}
              Level{' '}
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
              Select
            </Text>
            <Text>
              <Text bold color="cyan">
                [↑↓]
              </Text>{' '}
              {viewMode === 'tabs' ? 'Navigate' : 'Scroll'}{' '}
              <Text bold color="cyan">
                [PgUp/PgDn]
              </Text>{' '}
              Page{' '}
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
      </Box>
    );
  };

  const { unmount, waitUntilExit } = render(<App />);
  
  // Return cleanup function
  return { unmount, waitUntilExit };
}
