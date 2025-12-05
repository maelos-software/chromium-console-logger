import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import path from 'path';

export async function startTUI(config, CDPClient, LogWriter) {
  const App = () => {
    // Get absolute path to log file
    const absoluteLogPath = path.resolve(config.logFile);
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
    const [searchMode, setSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMatchIndex, setSearchMatchIndex] = useState(0);
    const [detailViewEvent, setDetailViewEvent] = useState(null); // Event to show in detail view
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
      // Detail view mode - different controls
      if (detailViewEvent) {
        if (key.escape || input === 'q') {
          setDetailViewEvent(null);
        } else if (key.upArrow || input === 'k') {
          // Previous event
          const currentIdx = filteredEvents.findIndex((e) => e.ts === detailViewEvent.ts);
          if (currentIdx > 0) {
            setDetailViewEvent(filteredEvents[currentIdx - 1]);
          }
        } else if (key.downArrow || input === 'j') {
          // Next event
          const currentIdx = filteredEvents.findIndex((e) => e.ts === detailViewEvent.ts);
          if (currentIdx < filteredEvents.length - 1) {
            setDetailViewEvent(filteredEvents[currentIdx + 1]);
          }
        }
        return;
      }

      // Search mode - typing adds to search query
      if (searchMode) {
        if (key.escape) {
          setSearchMode(false);
          setSearchQuery('');
          setSearchMatchIndex(0);
        } else if (key.return) {
          setSearchMode(false);
        } else if (key.backspace || key.delete) {
          setSearchQuery((prev) => prev.slice(0, -1));
          setSearchMatchIndex(0);
        } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
          setSearchQuery((prev) => prev + input);
          setSearchMatchIndex(0);
        }
        return;
      }

      // Normal mode controls
      if (input === 'q' || (key.ctrl && input === 'c')) {
        exit();
      } else if (input === '/') {
        setSearchMode(true);
        setSearchQuery('');
      } else if (input === 'n' && searchQuery) {
        // Next search match
        const matches = getSearchMatches();
        if (matches.length > 0) {
          setSearchMatchIndex((prev) => (prev + 1) % matches.length);
          setScrollOffset(matches[(searchMatchIndex + 1) % matches.length]);
        }
      } else if (input === 'N' && searchQuery) {
        // Previous search match
        const matches = getSearchMatches();
        if (matches.length > 0) {
          setSearchMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
          setScrollOffset(matches[(searchMatchIndex - 1 + matches.length) % matches.length]);
        }
      } else if (key.return && viewMode === 'events' && filteredEvents.length > 0) {
        // Show detail view for event at scroll offset
        setDetailViewEvent(filteredEvents[scrollOffset] || filteredEvents[0]);
      } else if (input === 'p') {
        setPaused((prev) => !prev);
      } else if (input === 'c') {
        setRecentEvents([]);
        setScrollOffset(0);
        setSearchQuery('');
        setSearchMatchIndex(0);
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
        // Cycle through log level filters
        setLogLevelFilter((prev) => {
          if (prev.length === 0) return ['error'];
          if (prev.length === 1 && prev[0] === 'error') return ['error', 'warn'];
          if (prev.length === 2) return ['error', 'warn', 'info'];
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
          const newIndex = Math.max(-1, highlightedTabIndex - 1);
          setHighlightedTabIndex(newIndex);
          if (newIndex < tabScrollOffset) {
            setTabScrollOffset(Math.max(0, newIndex));
          }
        } else {
          setScrollOffset((prev) => Math.max(0, prev - 1));
        }
      } else if (key.downArrow) {
        if (viewMode === 'tabs') {
          const newIndex = Math.min(tabs.length - 1, highlightedTabIndex + 1);
          setHighlightedTabIndex(newIndex);
          if (newIndex >= tabScrollOffset + 6) {
            setTabScrollOffset(newIndex - 5);
          }
        } else {
          setScrollOffset((prev) => Math.min(filteredEvents.length - 1, prev + 1));
        }
      } else if (key.pageUp) {
        setScrollOffset((prev) => Math.max(0, prev - 10));
      } else if (key.pageDown) {
        setScrollOffset((prev) => Math.min(filteredEvents.length - 1, prev + 10));
      } else if (key.return && viewMode === 'tabs') {
        if (highlightedTabIndex === -1) {
          setSelectedTabId(null);
        } else if (highlightedTabIndex >= 0 && highlightedTabIndex < tabs.length) {
          setSelectedTabId(tabs[highlightedTabIndex].id);
        }
        setViewMode('events');
      }
    });

    // Helper function to get search matches
    const getSearchMatches = () => {
      if (!searchQuery) return [];
      const matches = [];
      const query = searchQuery.toLowerCase();
      filteredEvents.forEach((event, idx) => {
        const message = formatEventMessage(event).toLowerCase();
        if (message.includes(query)) {
          matches.push(idx);
        }
      });
      return matches;
    };

    const formatEventMessage = (event) => {
      if (event.event === 'console' && event.args) {
        return event.args
          .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
          .join(' ');
      } else if (event.event === 'exception' && event.exceptionDetails) {
        return event.exceptionDetails.exception?.description || 'Exception';
      }
      return '';
    };

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
    // Controls: 3 lines minimum (border + text + border), can grow if wrapping occurs
    // Margins: 2 (between components)
    const maxVisibleTabCount = 6;
    const visibleTabCount = Math.min(tabs.length, maxVisibleTabCount);
    const tabsPanelHeight = tabs.length === 0 ? 4 : 4 + visibleTabCount;
    const headerHeight = 6;
    const controlsHeight = 3; // Minimum height, will grow if text wraps
    const margins = 2;
    const fixedHeight = headerHeight + tabsPanelHeight + controlsHeight + margins;
    
    // Events panel gets remaining space (minus 2 for its own borders)
    const eventsPanelInnerHeight = Math.max(3, terminalSize.rows - fixedHeight - 2);
    const maxVisibleEvents = eventsPanelInnerHeight - 1; // -1 for the "Events" header line
    const visibleEvents = filteredEvents.slice(scrollOffset, scrollOffset + maxVisibleEvents);
    
    // Get visible tabs with scrolling
    const visibleTabs = tabs.slice(tabScrollOffset, tabScrollOffset + maxVisibleTabCount);

    // Calculate search matches
    const searchMatches = searchQuery ? getSearchMatches() : [];

    // If detail view is active, render that instead
    if (detailViewEvent) {
      return (
        <Box flexDirection="column" width="100%" height="100%">
          <Box borderStyle="round" borderColor="yellow" paddingX={1} flexGrow={1}>
            <Box flexDirection="column" width="100%">
              <Text bold color="yellow">
                Event Details (Press Esc to close, ↑↓ to navigate)
              </Text>
              <Text dimColor>
                Time: {formatTimestamp(detailViewEvent.ts)} | Type: {detailViewEvent.type} | Tab:{' '}
                {tabs.findIndex((t) => detailViewEvent.url.includes(t.url)) + 1 || '?'}
              </Text>
              <Text dimColor>URL: {detailViewEvent.url}</Text>
              <Box marginTop={1}>
                <Text bold>Message:</Text>
              </Box>
              <Text>{formatEventMessage(detailViewEvent)}</Text>
              {detailViewEvent.args && (
                <>
                  <Box marginTop={1}>
                    <Text bold>Arguments:</Text>
                  </Box>
                  <Text>{JSON.stringify(detailViewEvent.args, null, 2)}</Text>
                </>
              )}
              {detailViewEvent.stackTrace && (
                <>
                  <Box marginTop={1}>
                    <Text bold>Stack Trace:</Text>
                  </Box>
                  {detailViewEvent.stackTrace.callFrames?.map((frame, idx) => (
                    <Text key={idx} dimColor>
                      at {frame.functionName || '(anonymous)'} ({frame.url}:{frame.lineNumber}:
                      {frame.columnNumber})
                    </Text>
                  ))}
                </>
              )}
              {detailViewEvent.exceptionDetails && (
                <>
                  <Box marginTop={1}>
                    <Text bold color="red">
                      Exception Details:
                    </Text>
                  </Box>
                  <Text>{JSON.stringify(detailViewEvent.exceptionDetails, null, 2)}</Text>
                </>
              )}
            </Box>
          </Box>
        </Box>
      );
    }

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
              Log: <Text color="yellow">{absoluteLogPath}</Text>
              {logLevelFilter.length > 0 && (
                <>
                  {' | '}Filter: <Text color="magenta">{logLevelFilter.join(', ')}</Text>
                </>
              )}
              {searchQuery && (
                <>
                  {' | '}Search: <Text color="green">{searchQuery}</Text> ({searchMatches.length} matches)
                </>
              )}
            </Text>
            {searchMode && (
              <Text color="yellow">
                Search: {searchQuery}_ (Press Esc to cancel, Enter to finish)
              </Text>
            )}
            {statusMessage && !searchMode && <Text dimColor>{statusMessage}</Text>}
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
              {tabScrollOffset > 0 && '↑ '}
              Monitored Tabs ({tabs.length})
              {tabs.length > maxVisibleTabCount && ` [${tabScrollOffset + 1}-${Math.min(tabScrollOffset + maxVisibleTabCount, tabs.length)}]`}
              {tabScrollOffset + maxVisibleTabCount < tabs.length && ' ↓'}
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
                const eventIndex = scrollOffset + idx;
                const isSearchMatch = searchMatches.includes(eventIndex);
                const isCurrentMatch = searchMatches[searchMatchIndex] === eventIndex;
                
                return (
                  <Box
                    key={scrollOffset + idx}
                    backgroundColor={isCurrentMatch ? 'yellow' : isSearchMatch ? 'blue' : undefined}
                  >
                    <Text dimColor={!isSearchMatch}>{time}</Text>
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
          <Box flexWrap="wrap">
            <Text bold color="cyan">[q]</Text>
            <Text> Quit </Text>
            <Text bold color="cyan">[p]</Text>
            <Text> {paused ? 'Resume' : 'Pause'} </Text>
            <Text bold color="cyan">[c]</Text>
            <Text> Clear </Text>
            <Text bold color="cyan">[/]</Text>
            <Text> Search </Text>
            {searchQuery && (
              <>
                <Text bold color="cyan">[n/N]</Text>
                <Text> Next/Prev </Text>
              </>
            )}
            <Text bold color="cyan">[Enter]</Text>
            <Text> Details </Text>
            <Text bold color="cyan">[l]</Text>
            <Text> Level </Text>
            <Text bold color="cyan">[t]</Text>
            <Text> Tab Nav </Text>
            <Text bold color="cyan">[a]</Text>
            <Text> All </Text>
            <Text bold color="cyan">[1-9]</Text>
            <Text> Select </Text>
            <Text bold color="cyan">[↑↓]</Text>
            <Text> {viewMode === 'tabs' ? 'Navigate' : 'Scroll'} </Text>
            <Text bold color="cyan">[PgUp/PgDn]</Text>
            <Text> Page </Text>
            {tabs.length > maxVisibleTabCount && viewMode === 'events' && (
              <Text dimColor>(Press [t] to see all {tabs.length} tabs)</Text>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  const { unmount, waitUntilExit } = render(<App />);
  
  // Return cleanup function
  return { unmount, waitUntilExit };
}
