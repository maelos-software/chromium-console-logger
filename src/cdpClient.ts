import { EventEmitter } from 'events';
import CDP from 'chrome-remote-interface';
import { CDPClientConfig, CapturedEvent } from './types';
import { safeSerialize, calculateBackoff, sleep } from './util';

/**
 * CDPClient manages the connection to Chrome DevTools Protocol
 * and captures console and exception events from multiple targets
 */
export class CDPClient extends EventEmitter {
  private config: CDPClientConfig;
  private clients: Map<string, any> = new Map(); // targetId -> client
  private connected: boolean = false;
  private reconnecting: boolean = false;
  private shouldReconnect: boolean = true;
  private reconnectAttempt: number = 0;
  private currentTargets: Set<string> = new Set(); // Track connected target IDs

  constructor(config: CDPClientConfig) {
    super();
    this.config = config;
  }

  /**
   * Establishes connections to CDP and attaches to all matching targets
   */
  async connect(): Promise<void> {
    try {
      if (this.config.verbose) {
        console.log(`Connecting to CDP at ${this.config.host}:${this.config.port}...`);
      }

      // Get list of targets
      const targets = await CDP.List({
        host: this.config.host,
        port: this.config.port,
      });

      // Emit all page targets for TUI
      const pageTargets = targets.filter((t: any) => t.type === 'page');
      this.emit('targets', pageTargets);

      // Find targets to connect to
      const targetsToConnect = this.findTargets(targets);

      if (targetsToConnect.length === 0) {
        throw new Error('No suitable targets found');
      }

      if (this.config.verbose) {
        console.log(`Attaching to ${targetsToConnect.length} target(s)...`);
      }

      // Connect to all targets
      await this.connectToTargets(targetsToConnect);

      this.connected = true;
      this.reconnectAttempt = 0;
      this.emit('connected');

      if (this.config.verbose) {
        console.log(`Successfully connected to ${this.clients.size} target(s)`);
      }

      // Periodically refresh target list and connect to new targets
      this.startTargetRefresh();
    } catch (error: any) {
      if (this.config.verbose) {
        console.error(`Failed to connect to CDP: ${error.message}`);
      }

      if (this.shouldReconnect) {
        await this.reconnectWithBackoff();
      } else {
        throw error;
      }
    }
  }

  /**
   * Connects to multiple targets
   */
  private async connectToTargets(targets: any[]): Promise<void> {
    const promises = targets.map((target) => this.connectToTarget(target));
    await Promise.allSettled(promises);
  }

  /**
   * Connects to a single target
   */
  private async connectToTarget(target: any): Promise<void> {
    try {
      // Skip if already connected
      if (this.clients.has(target.id)) {
        return;
      }

      if (this.config.verbose) {
        console.log(`Connecting to target: ${target.url}`);
      }

      // Connect to the target
      const client = await CDP({
        host: this.config.host,
        port: this.config.port,
        target: target.id,
      });

      // Enable Runtime domain
      await client.Runtime.enable();

      // Subscribe to console events
      client.Runtime.consoleAPICalled((params: any) => {
        this.handleConsoleAPI(params, target);
      });

      // Subscribe to exception events
      client.Runtime.exceptionThrown((params: any) => {
        this.handleException(params, target);
      });

      // Handle disconnection
      client.on('disconnect', () => {
        if (this.config.verbose) {
          console.log(`Target disconnected: ${target.url}`);
        }
        this.clients.delete(target.id);
        this.currentTargets.delete(target.id);

        // If all clients disconnected, emit disconnected event
        if (this.clients.size === 0) {
          this.connected = false;
          this.emit('disconnected');

          if (this.shouldReconnect) {
            this.reconnectWithBackoff();
          }
        }
      });

      this.clients.set(target.id, client);
      this.currentTargets.add(target.id);

      if (this.config.verbose) {
        console.log(`Connected to target: ${target.url}`);
      }
    } catch (error: any) {
      if (this.config.verbose) {
        console.error(`Failed to connect to target ${target.url}: ${error.message}`);
      }
    }
  }

  /**
   * Periodically refreshes the list of available targets and connects to new ones
   */
  private targetRefreshInterval: NodeJS.Timeout | null = null;

  private startTargetRefresh(): void {
    // Clear any existing interval
    if (this.targetRefreshInterval) {
      clearInterval(this.targetRefreshInterval);
    }

    // Refresh target list every 2 seconds
    this.targetRefreshInterval = setInterval(async () => {
      if (!this.connected) return;

      try {
        const targets = await CDP.List({
          host: this.config.host,
          port: this.config.port,
        });

        const pageTargets = targets.filter((t: any) => t.type === 'page');
        this.emit('targets', pageTargets);

        // Find targets we should be connected to
        const targetsToConnect = this.findTargets(targets);

        // Connect to any new targets
        const newTargets = targetsToConnect.filter((t: any) => !this.currentTargets.has(t.id));
        if (newTargets.length > 0) {
          await this.connectToTargets(newTargets);
        }

        // Disconnect from targets that no longer match our filters
        const targetIds = new Set(targetsToConnect.map((t: any) => t.id));
        for (const [id, client] of this.clients.entries()) {
          if (!targetIds.has(id)) {
            if (this.config.verbose) {
              console.log(`Disconnecting from target: ${id}`);
            }
            try {
              await client.close();
            } catch (error) {
              // Ignore errors
            }
            this.clients.delete(id);
            this.currentTargets.delete(id);
          }
        }
      } catch (error) {
        // Ignore errors during refresh
      }
    }, 2000);
  }

  /**
   * Finds all targets to attach to based on filters
   * @param targets List of available targets
   * @returns Array of targets to connect to
   */
  private findTargets(targets: any[]): any[] {
    // Filter for page targets
    let pageTargets = targets.filter((t: any) => t.type === 'page');

    if (pageTargets.length === 0) {
      return [];
    }

    // If tab indices are specified, filter by them
    if (this.config.tabIndices && this.config.tabIndices.length > 0) {
      pageTargets = pageTargets.filter((t: any, idx: number) =>
        this.config.tabIndices!.includes(idx + 1)
      );
    }

    // If URL substring filter is specified, apply it
    if (this.config.targetUrlSubstring) {
      pageTargets = pageTargets.filter((t: any) => t.url.includes(this.config.targetUrlSubstring!));
    }

    return pageTargets;
  }

  /**
   * Handles console API called events from CDP
   */
  private handleConsoleAPI(params: any, target: any): void {
    try {
      const event: CapturedEvent = {
        ts: Date.now(),
        event: 'console',
        type: params.type,
        url: params.stackTrace?.callFrames?.[0]?.url || target.url || 'unknown',
        args: params.args.map((arg: any) => this.serializeRemoteObject(arg)),
        stackTrace: params.stackTrace,
      };

      this.emit('event', event);
    } catch (error: any) {
      console.error(`Error handling console event: ${error.message}`);
    }
  }

  /**
   * Handles exception thrown events from CDP
   */
  private handleException(params: any, target: any): void {
    try {
      const event: CapturedEvent = {
        ts: Date.now(),
        event: 'exception',
        type: 'exception',
        url: params.exceptionDetails?.url || target.url || 'unknown',
        stackTrace: params.exceptionDetails?.stackTrace,
        exceptionDetails: params.exceptionDetails,
      };

      this.emit('event', event);
    } catch (error: any) {
      console.error(`Error handling exception event: ${error.message}`);
    }
  }

  /**
   * Serializes a CDP RemoteObject to a JSON-serializable value
   */
  private serializeRemoteObject(remoteObject: any): any {
    if (remoteObject.value !== undefined) {
      return safeSerialize(remoteObject.value);
    }

    if (remoteObject.unserializableValue) {
      return remoteObject.unserializableValue;
    }

    if (remoteObject.description) {
      return remoteObject.description;
    }

    return safeSerialize(remoteObject);
  }

  /**
   * Implements exponential backoff reconnection
   */
  private async reconnectWithBackoff(): Promise<void> {
    if (this.reconnecting) {
      return;
    }

    this.reconnecting = true;

    while (this.shouldReconnect && !this.connected) {
      const delay = calculateBackoff(this.reconnectAttempt);

      if (this.config.verbose) {
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1})...`);
      }

      await sleep(delay);

      try {
        await this.connect();
        this.reconnecting = false;
        return;
      } catch (error) {
        this.reconnectAttempt++;
      }
    }

    this.reconnecting = false;
  }

  /**
   * Disconnects from all CDP targets
   */
  async disconnect(): Promise<void> {
    this.shouldReconnect = false;

    // Clear target refresh interval
    if (this.targetRefreshInterval) {
      clearInterval(this.targetRefreshInterval);
      this.targetRefreshInterval = null;
    }

    // Disconnect all clients
    const disconnectPromises = Array.from(this.clients.values()).map(async (client) => {
      try {
        await client.close();
      } catch (error) {
        // Ignore errors during disconnect
      }
    });

    await Promise.allSettled(disconnectPromises);

    this.clients.clear();
    this.currentTargets.clear();
    this.connected = false;
  }

  /**
   * Checks if currently connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
