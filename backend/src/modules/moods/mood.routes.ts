import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './mood.controller.js';
import {
  analyticsQuerySchema,
  createMoodSchema,
  idParamSchema,
  listMoodsSchema,
  updateMoodSchema,
} from './mood.schemas.js';

export const moodRouter = Router();

moodRouter.get('/vocabulary', controller.vocabularyHandler);

moodRouter.use(requireAuth);

moodRouter.get('/today', controller.todayHandler);
moodRouter.get('/analytics', validate({ query: analyticsQuerySchema }), controller.analyticsHandler);

moodRouter.get('/', validate({ query: listMoodsSchema }), controller.listHandler);
moodRouter.post('/', validate({ body: createMoodSchema }), controller.createHandler);
moodRouter.get('/:id', validate({ params: idParamSchema }), controller.getHandler);
moodRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateMoodSchema }),
  controller.updateHandler,
);
moodRouter.delete('/:id', validate({ params: idParamSchema }), controller.deleteHandler);
