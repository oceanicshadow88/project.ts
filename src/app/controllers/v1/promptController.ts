import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import status from 'http-status';
import { asyncHandler } from '../../utils/helper';
import {
  createPrompt,
  getPrompts,
  getPromptById,
  updatePrompt,
  deletePrompt,
} from '../../services/promptService';

export const index = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await getPrompts(req);
  return res.status(status.OK).json(result);
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await getPromptById(req);
  return res.status(status.OK).json(result);
});

export const store = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await createPrompt(req);
  return res.status(status.CREATED).json(result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await updatePrompt(req);
  return res.status(status.OK).json(result);
});

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  await deletePrompt(req);
  return res.status(status.NO_CONTENT).send();
});
