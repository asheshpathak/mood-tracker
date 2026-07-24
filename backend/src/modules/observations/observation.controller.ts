import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth.js';
import { parsedQuery } from '../../middleware/validate.js';
import * as service from './observation.service.js';
import type {
  CreateObservationInput,
  ListObservationsQuery,
  UpdateObservationInput,
} from './observation.schemas.js';

export async function createHandler(req: Request, res: Response) {
  const observation = await service.createObservation(
    currentUser(req).id,
    req.body as CreateObservationInput,
  );
  res.status(201).json({ observation: observation.toJSON() });
}

export async function listHandler(req: Request, res: Response) {
  const query = parsedQuery<ListObservationsQuery>(res);
  res.json(await service.listObservations(currentUser(req).id, query));
}

export async function getHandler(req: Request, res: Response) {
  const observation = await service.getObservation(currentUser(req).id, String(req.params.id));
  res.json({ observation: observation.toJSON() });
}

export async function updateHandler(req: Request, res: Response) {
  const observation = await service.updateObservation(
    currentUser(req).id,
    String(req.params.id),
    req.body as UpdateObservationInput,
  );
  res.json({ observation: observation.toJSON() });
}

export async function deleteHandler(req: Request, res: Response) {
  await service.deleteObservation(currentUser(req).id, String(req.params.id));
  res.status(204).send();
}

export async function pinHandler(req: Request, res: Response) {
  const observation = await service.togglePin(currentUser(req).id, String(req.params.id));
  res.json({ observation: observation.toJSON() });
}

export async function tagsHandler(req: Request, res: Response) {
  res.json({ tags: await service.listTags(currentUser(req).id) });
}

export async function statsHandler(req: Request, res: Response) {
  res.json(await service.getStats(currentUser(req).id));
}
