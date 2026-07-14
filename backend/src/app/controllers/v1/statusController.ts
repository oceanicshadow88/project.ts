import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import httpStatus from 'http-status';
import { asyncHandler } from '../../utils/helper';
import { replaceId } from '../../services/replaceService';
import { getAllStatus, updateStatus } from '../../services/statusService';

// GET all
export const index = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(httpStatus.UNPROCESSABLE_ENTITY);
  }

  const statuses = await getAllStatus(req);
  return res.status(httpStatus.OK).json(replaceId(statuses));
});

// PUT update
export const update = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(httpStatus.UNPROCESSABLE_ENTITY);
  }

  const result = await updateStatus(req);
  return res.status(httpStatus.OK).json(replaceId(result));
});
