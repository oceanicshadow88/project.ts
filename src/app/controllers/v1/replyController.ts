import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import status from 'http-status';
import { asyncHandler } from '../../utils/helper';
import {
  createReply,
  getRepliesByQuestion,
  updateReply,
  deleteReply,
} from '../../services/replyService';

export const index = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await getRepliesByQuestion(req);
  return res.status(status.OK).json(result);
});

export const store = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await createReply(req);
  return res.status(status.CREATED).json(result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await updateReply(req);
  return res.status(status.OK).json(result);
});

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  await deleteReply(req);
  return res.sendStatus(status.OK);
});

