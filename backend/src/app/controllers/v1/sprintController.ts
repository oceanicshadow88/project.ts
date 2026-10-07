import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { replaceId } from '../../services/replaceService';
import {
  deleteSprint,
  findLatestSprints,
  findSprints,
  findSprint,
  updateSprint,
  createSprint,
} from '../../services/sprintService';
import { asyncHandler } from '../../utils/helper';
import status from 'http-status';
import {
  assertProjectAccessibleForTenant,
  assertSprintAccessibleForTenant,
} from '../../utils/tenantScopeUtils';

export const currentSprint = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const { projectId } = req.params;
  const sprints = await findLatestSprints(req.dbConnection, projectId);
  res.status(status.OK).send(sprints);
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const { projectId } = req.params;
  await assertProjectAccessibleForTenant(req.dbConnection, projectId, req.tenantId);
  const sprintStatus = req.query.status as 'active' | 'planning' | 'completed' | undefined;
  const sprints = await findSprints(projectId, req.dbConnection, sprintStatus);
  res.status(status.OK).send(sprints);
});

export const store = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }

  await assertProjectAccessibleForTenant(req.dbConnection, req.body.projectId, req.tenantId);
  const sprint = await createSprint(req.dbConnection, req.body);
  const createdSprint = await findSprint(req.dbConnection, sprint.id);
  res.status(status.CREATED).send(replaceId(createdSprint));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const sprint = await findSprint(req.dbConnection, id);
  if (!sprint) return res.status(404).send();
  await assertSprintAccessibleForTenant(req.dbConnection, id, req.tenantId);

  const updatedSprint = await updateSprint(req.dbConnection, id, req.body);
  res.status(status.OK).json(replaceId(updatedSprint));
});

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const sprint = await findSprint(req.dbConnection, id);
  if (!sprint) return res.status(404).send();
  await assertSprintAccessibleForTenant(req.dbConnection, id, req.tenantId);
  await deleteSprint(req.dbConnection, id);
  return res.status(status.OK).json({});
});
