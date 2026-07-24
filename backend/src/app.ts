import crypto from 'node:crypto';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { apiRouter } from './routes.js';
import { ApiError } from './utils/ApiError.js';
import { logger } from './utils/logger.js';

export function createApp() {
  const app = express();

  // Railway (and most PaaS) terminate TLS at a proxy — trust it so rate limiting
  // and protocol detection see the real client.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin / curl / health checks send no Origin header.
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/$/, '');
        if (env.corsOrigins.includes(normalized)) return callback(null, true);
        // Allow Vercel preview deployments of the same project.
        if (/^https:\/\/[\w-]+\.vercel\.app$/.test(normalized) && !env.isProd) {
          return callback(null, true);
        }
        return callback(ApiError.forbidden(`Origin ${origin} is not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
      maxAge: 86_400,
    }),
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: true, limit: '256kb' }));

  app.get('/', (_req, res) => {
    res.json({ name: 'mood-tracker-api', version: 1, docs: '/api/health' });
  });

  app.use('/api', apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
