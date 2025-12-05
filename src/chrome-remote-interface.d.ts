declare module 'chrome-remote-interface' {
  interface CDPOptions {
    host?: string;
    port?: number;
    target?: string | ((targets: any[]) => any);
  }

  interface CDPClient {
    Runtime: {
      enable(): Promise<void>;
      consoleAPICalled(handler: (params: any) => void): void;
      exceptionThrown(handler: (params: any) => void): void;
    };
    close(): Promise<void>;
    on(event: string, handler: (...args: any[]) => void): void;
  }

  function CDP(options?: CDPOptions): Promise<CDPClient>;

  namespace CDP {
    function List(options?: { host?: string; port?: number }): Promise<any[]>;
  }

  export = CDP;
}
