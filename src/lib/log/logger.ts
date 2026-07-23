/**
 * Request-scoped structured logger (D13 §20, D10 §20–21).
 * Emits one JSON line per event with request id, user/household context, and
 * timing. All payloads pass through `redact` so no PII/tokens/financial detail
 * lands in logs (§1 Global Conventions).
 */
import { redact } from "./redact";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId: string;
  userId?: string;
  householdId?: string;
  method?: string;
  path?: string;
}

type LogData = Record<string, unknown>;

const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: LogLevel =
  process.env.NODE_ENV === "production" ? "info" : "debug";

export class Logger {
  private readonly context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
  }

  /** Derive a child logger with extra bound context (e.g. after auth resolves userId). */
  child(extra: Partial<LogContext>): Logger {
    return new Logger({ ...this.context, ...extra });
  }

  get requestId(): string {
    return this.context.requestId;
  }

  private write(level: LogLevel, message: string, data?: LogData): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return;
    const entry: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      msg: message,
      ...this.context,
    };
    if (data !== undefined) entry.data = redact(data);

    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  debug(message: string, data?: LogData): void {
    this.write("debug", message, data);
  }
  info(message: string, data?: LogData): void {
    this.write("info", message, data);
  }
  warn(message: string, data?: LogData): void {
    this.write("warn", message, data);
  }
  error(message: string, data?: LogData): void {
    this.write("error", message, data);
  }
}

/**
 * Build a request-scoped logger from an incoming request.
 * Reuses an inbound `x-request-id` if present, otherwise mints one.
 */
export function createRequestLogger(req: Request, extra?: Partial<LogContext>): Logger {
  const url = new URL(req.url);
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  return new Logger({
    requestId,
    method: req.method,
    path: url.pathname,
    ...extra,
  });
}
