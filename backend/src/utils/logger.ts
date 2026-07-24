import { createRequire } from 'node:module';
import pino, { type LoggerOptions } from 'pino';
import { env } from '../config/env.js';

const require = createRequire(import.meta.url);

/**
 * Pretty logs are a development nicety, and `pino-pretty` is a devDependency —
 * which a production install prunes. Asking pino for a transport that isn't
 * installed throws while the module is still initialising, killing the process
 * before anything can report why. So the transport is only requested when the
 * package is genuinely resolvable; otherwise we fall back to JSON, which is what
 * a log aggregator wants anyway.
 */
function prettyTransport(): Pick<LoggerOptions, 'transport'> {
  if (env.isProd) return {};

  try {
    require.resolve('pino-pretty');
  } catch {
    return {};
  }

  return {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  };
}

export const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.refreshToken'],
    censor: '[redacted]',
  },
  ...prettyTransport(),
});
