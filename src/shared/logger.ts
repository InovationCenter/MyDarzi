type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function write(level: LogLevel, message: string, meta?: unknown) {
  const payload = meta === undefined ? message : `${message} ${JSON.stringify(meta)}`;
  // Technical logs only — never show raw stack traces in UI.
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](`[MyDarzi:${level}] ${payload}`);
}

export const logger = {
  debug: (message: string, meta?: unknown) => write('debug', message, meta),
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (message: string, meta?: unknown) => write('error', message, meta),
};
