import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import status from 'http-status';
import { createApiToken } from '../../services/apiTokenService';
import { asyncHandler } from '../../utils/helper';

export const store = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await createApiToken(req);
  return res.status(status.CREATED).send(result);
});
