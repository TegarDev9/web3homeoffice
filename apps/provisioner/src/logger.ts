type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {})
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}


