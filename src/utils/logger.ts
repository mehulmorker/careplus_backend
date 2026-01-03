enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = this.parseLevel(process.env.LOG_LEVEL || "info");
  }

  private parseLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case "error":
        return LogLevel.ERROR;
      case "warn":
        return LogLevel.WARN;
      case "info":
        return LogLevel.INFO;
      case "debug":
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private formatEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private log(
    level: LogLevel,
    levelName: string,
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (level > this.level) return;

    const entry: LogEntry = {
      level: levelName,
      message,
      timestamp: new Date().toISOString(),
      ...(data && { data }),
    };

    const output = this.formatEntry(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  error(message: string, data?: Record<string, unknown>): void {
    if (data?.error instanceof Error) {
      data = {
        ...data,
        error: {
          name: data.error.name,
          message: data.error.message,
          stack: data.error.stack,
        },
      };
    }
    this.log(LogLevel.ERROR, "ERROR", message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, "WARN", message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, "INFO", message, data);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, "DEBUG", message, data);
  }
}

export const logger = new Logger();

