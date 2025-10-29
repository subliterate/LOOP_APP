/**
 * Lightweight structured logging utility
 * Supports console and JSON formatting
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  [key: string]: unknown;
}

/**
 * Structured logger for application events
 */
export class Logger {
  private serviceName: string;
  private minLevel: LogLevel;
  private enableJson: boolean;

  constructor(serviceName: string, enableJson = false) {
    this.serviceName = serviceName;
    this.enableJson = enableJson || process.env.LOG_FORMAT === 'json';

    const levelEnv = process.env.LOG_LEVEL?.toUpperCase();
    this.minLevel = (Object.values(LogLevel).includes(levelEnv as LogLevel)
      ? levelEnv
      : LogLevel.INFO) as LogLevel;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  /**
   * Format structured log entry
   */
  private formatLog(level: LogLevel, message: string, context: LogContext): string | object {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...context,
    };

    if (this.enableJson) {
      return logEntry;
    }

    const contextStr = Object.keys(context).length > 0
      ? ` ${JSON.stringify(context)}`
      : '';

    return `[${timestamp}] [${level}] [${this.serviceName}] ${message}${contextStr}`;
  }

  /**
   * Output log with appropriate console method
   */
  private output(level: LogLevel, formatted: string | object): void {
    const logFn =
      level === LogLevel.ERROR
        ? console.error
        : level === LogLevel.WARN
          ? console.warn
          : console.log;

    if (this.enableJson) {
      logFn(JSON.stringify(formatted));
    } else {
      logFn(formatted);
    }
  }

  debug(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(LogLevel.DEBUG, this.formatLog(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(LogLevel.INFO, this.formatLog(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(LogLevel.WARN, this.formatLog(LogLevel.WARN, message, context));
    }
  }

  error(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.output(LogLevel.ERROR, this.formatLog(LogLevel.ERROR, message, context));
    }
  }
}

/**
 * Create a logger instance
 */
export const createLogger = (serviceName: string): Logger => {
  return new Logger(serviceName);
};
