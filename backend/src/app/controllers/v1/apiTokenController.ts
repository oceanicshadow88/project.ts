import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import status from 'http-status';
import { createApiToken, listApiTokens, revokeApiToken } from '../../services/apiTokenService';
import { asyncHandler } from '../../utils/helper';

export const store = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await createApiToken(req);
  return res.status(status.CREATED).send(result);
});

export const index = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await listApiTokens(req);
  return res.status(status.OK).send(result);
});

export const revoke = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await revokeApiToken(req);
  if (!result) return res.sendStatus(status.NOT_FOUND);
  return res.status(status.NO_CONTENT).send();
});
