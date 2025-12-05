import { EventEmitter } from 'events';
import CDP from 'chrome-remote-interface';
import { CDPClientConfig, CapturedEvent } from './types';
import { safeSerialize, calculateBackoff, sleep } from './util';

/**
 * CDPClient manages the connection to Chrome DevTools Protocol
 * and captures console and exception events
 */
export class CDPClient extends EventEmitter {
  private config: CDPClientConfig;
  private client: any = null;
  private connected: boolean = false;
  private reconnecting: boolean = false;
  private shouldReconnect: boolean = true;
  private reconnectAttempt: number = 0;

  constructor(config: CDPClientConfig) {
    super();
    this.config = config;
  }

  /**
   * Establishes connection to CDP and attaches to a target
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

      // Find appropriate target
      const target = this.findTarget(targets);
      
      if (!target) {
        throw new Error('No suitable target found');
      }

      if (this.config.verbose) {
        console.log(`Attaching to target: ${target.url}`);
      }

      // Connect to the target
      this.client = await CDP({
        host: this.config.host,
        port: this.config.port,
        target: target.id,
      });

      // Enable Runtime domain
      await this.client.Runtime.enable();

      // Subscribe to console events
      this.client.Runtime.consoleAPICalled(this.handleConsoleAPI.bind(this));

      // Subscribe to exception events
      this.client.Runtime.exceptionThrown(this.handleException.bind(this));

      // Handle disconnection
      this.client.on('disconnect', () => {
        if (this.config.verbose) {
          console.log('CDP connection lost');
        }
        this.connected = false;
        this.emit('disconnected');
        
        if (this.shouldReconnect) {
          this.reconnectWithBackoff();
        }
      });

      this.connected = true;
      this.reconnectAttempt = 0;
      this.emit('connected');

      if (this.config.verbose) {
        console.log('Successfully connected to CDP');
      }
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
   * Finds an appropriate target to attach to
   * @param targets List of available targets
   * @returns The selected target or null
   */
  findTarget(targets: any[]): any | null {
    // Filter for page targets
    const pageTargets = targets.filter((t) => t.type === 'page');

    if (pageTargets.length === 0) {
      return null;
    }

    // If URL substring filter is specified, use it
    if (this.config.targetUrlSubstring) {
      const filtered = pageTargets.filter((t) =>
        t.url.includes(this.config.targetUrlSubstring!)
      );
      return filtered.length > 0 ? filtered[0] : null;
    }

    // Otherwise, return the first page target
    return pageTargets[0];
  }

  /**
   * Handles console API called events from CDP
   */
  private handleConsoleAPI(params: any): void {
    try {
      const event: CapturedEvent = {
        ts: Date.now(),
        event: 'console',
        type: params.type,
        url: params.stackTrace?.callFrames?.[0]?.url || 'unknown',
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
  private handleException(params: any): void {
    try {
      const event: CapturedEvent = {
        ts: Date.now(),
        event: 'exception',
        type: 'exception',
        url: params.exceptionDetails?.url || 'unknown',
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
   * Disconnects from CDP
   */
  async disconnect(): Promise<void> {
    this.shouldReconnect = false;
    
    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        // Ignore errors during disconnect
      }
      this.client = null;
    }

    this.connected = false;
  }

  /**
   * Checks if currently connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
