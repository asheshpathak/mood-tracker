import { Router } from 'express';
import mongoose from 'mongoose';
import { authRouter } from './modules/auth/auth.routes.js';
import { moodRouter } from './modules/moods/mood.routes.js';
import { observationRouter } from './modules/observations/observation.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'] as const;
  const dbState: string = states[mongoose.connection.readyState as 0 | 1 | 2 | 3] ?? 'unknown';
  res.status(dbState === 'connected' ? 200 : 503).json({
    status: dbState === 'connected' ? 'ok' : 'degraded',
    db: dbState,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/moods', moodRouter);
apiRouter.use('/observations', observationRouter);
