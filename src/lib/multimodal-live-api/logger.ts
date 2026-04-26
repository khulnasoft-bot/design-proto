import { EventEmitter } from "events";

export enum LogSource {
  CLIENT = 'client',
  SERVER = 'server',
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  source: LogSource;
  type: string;
  message: string;
  data?: any;
}

class Logger extends EventEmitter {
  private logs: LogEntry[] = [];
  private maxLogs = 500;

  log(source: LogSource, type: string, message: string, data?: any) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      source,
      type,
      message,
      data,
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();
    this.emit('log', entry);
  }

  getLogs() {
    return this.logs;
  }
}

export const logger = new Logger();
