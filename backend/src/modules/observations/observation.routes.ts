import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './observation.controller.js';
import {
  createObservationSchema,
  idParamSchema,
  listObservationsSchema,
  updateObservationSchema,
} from './observation.schemas.js';

export const observationRouter = Router();

observationRouter.use(requireAuth);

observationRouter.get('/tags', controller.tagsHandler);
observationRouter.get('/stats', controller.statsHandler);

observationRouter.get('/', validate({ query: listObservationsSchema }), controller.listHandler);
observationRouter.post('/', validate({ body: createObservationSchema }), controller.createHandler);
observationRouter.get('/:id', validate({ params: idParamSchema }), controller.getHandler);
observationRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateObservationSchema }),
  controller.updateHandler,
);
observationRouter.post('/:id/pin', validate({ params: idParamSchema }), controller.pinHandler);
observationRouter.delete('/:id', validate({ params: idParamSchema }), controller.deleteHandler);
