import * as fs from 'fs';
import * as path from 'path';
import { LogWriterConfig, CapturedEvent } from './types';

/**
 * LogWriter handles writing captured events to NDJSON files with rotation support
 */
export class LogWriter {
  private config: LogWriterConfig;
  private fileHandle: fs.WriteStream | null = null;
  private currentSize: number = 0;

  constructor(config: LogWriterConfig) {
    this.config = {
      ...config,
      maxSizeBytes: config.maxSizeBytes || Infinity,
      rotateKeep: config.rotateKeep || 5,
    };
    this.openFile();
  }

  /**
   * Opens the log file for writing
   */
  private openFile(): void {
    try {
      // Check if file exists to get current size
      if (fs.existsSync(this.config.logFile)) {
        const stats = fs.statSync(this.config.logFile);
        this.currentSize = stats.size;
      } else {
        this.currentSize = 0;
      }

      // Open file in append mode
      this.fileHandle = fs.createWriteStream(this.config.logFile, {
        flags: 'a',
        encoding: 'utf8',
      });

      this.fileHandle.on('error', (error) => {
        console.error(`Error writing to log file: ${error.message}`);
      });
    } catch (error: any) {
      console.error(`Failed to open log file ${this.config.logFile}: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Writes a captured event to the log file
   * @param event The event to write
   */
  write(event: CapturedEvent): void {
    if (!this.fileHandle) {
      console.error('Log file handle is not open');
      return;
    }

    try {
      // Serialize event to NDJSON (single line JSON)
      const line = JSON.stringify(event) + '\n';
      const lineSize = Buffer.byteLength(line, 'utf8');

      // Write to file
      this.fileHandle.write(line);
      this.currentSize += lineSize;

      // Check if rotation is needed
      this.checkRotation();
    } catch (error: any) {
      console.error(`Error writing event to log: ${error.message}`);
    }
  }

  /**
   * Checks if log rotation is needed and performs it
   */
  private checkRotation(): void {
    if (this.currentSize >= this.config.maxSizeBytes!) {
      this.rotate();
    }
  }

  /**
   * Rotates the log file
   */
  private rotate(): void {
    try {
      if (this.config.verbose) {
        console.log(`Rotating log file ${this.config.logFile}`);
      }

      // Close current file handle
      if (this.fileHandle) {
        this.fileHandle.end();
        this.fileHandle = null;
      }

      // Shift existing rotated files
      const rotateKeep = this.config.rotateKeep!;
      for (let i = rotateKeep - 1; i >= 1; i--) {
        const oldFile = `${this.config.logFile}.${i}`;
        const newFile = `${this.config.logFile}.${i + 1}`;

        if (fs.existsSync(oldFile)) {
          if (i + 1 > rotateKeep) {
            // Delete files beyond the keep limit
            fs.unlinkSync(oldFile);
          } else {
            // Rename to next number
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Rename current file to .1
      if (fs.existsSync(this.config.logFile)) {
        fs.renameSync(this.config.logFile, `${this.config.logFile}.1`);
      }

      // Open new file
      this.currentSize = 0;
      this.openFile();

      if (this.config.verbose) {
        console.log(`Log rotation complete`);
      }
    } catch (error: any) {
      console.error(`Error during log rotation: ${error.message}`);
      // Try to reopen the file even if rotation failed
      if (!this.fileHandle) {
        this.openFile();
      }
    }
  }

  /**
   * Flushes any buffered data to disk
   */
  async flush(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.fileHandle) {
        resolve();
        return;
      }

      // Drain the write stream
      if (this.fileHandle.writableNeedDrain) {
        this.fileHandle.once('drain', () => resolve());
      } else {
        resolve();
      }
    });
  }

  /**
   * Closes the log file handle
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.fileHandle) {
        resolve();
        return;
      }

      this.fileHandle.end(() => {
        this.fileHandle = null;
        resolve();
      });
    });
  }
}
