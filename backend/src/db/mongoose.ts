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

export async function disconnectDatabase(): Promise<void> {
  connecting = null;
  await mongoose.connection.close(false);
}
