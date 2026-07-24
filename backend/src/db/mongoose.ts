import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);
if (env.isDev) mongoose.set('debug', false);

let connecting: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (connecting) return connecting;

  connecting = mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
    autoIndex: !env.isProd,
  });

  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));

  try {
    const conn = await connecting;
    // In production indexes are not auto-built on every model call; do it once at boot.
    if (env.isProd) {
      await Promise.all(Object.values(mongoose.models).map((m) => m.createIndexes()));
    }
    return conn;
  } catch (err) {
    connecting = null;
    throw err;
  }
}

/**
 * Retries with exponential backoff instead of dying on the first failure.
 *
 * Railway's private network takes a few seconds to come up after a container
 * starts, so the first attempt to reach `*.railway.internal` routinely fails on
 * a cold deploy. Exiting there would fail the health check for a problem that
 * resolves itself a second later.
 */
export async function connectDatabaseWithRetry(attempts = 8): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await connectDatabase();
      return;
    } catch (err) {
      if (attempt === attempts) {
        logger.fatal({ err }, `Could not reach MongoDB after ${attempts} attempts — exiting`);
        process.exit(1);
      }
      const delay = Math.min(1000 * 2 ** (attempt - 1), 15_000);
      logger.warn(
        { attempt, delay, reason: (err as Error).message },
        'MongoDB not reachable yet — retrying',
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  connecting = null;
  await mongoose.connection.close(false);
}
