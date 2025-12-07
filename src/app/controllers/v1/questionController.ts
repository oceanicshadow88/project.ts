import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import status from 'http-status';
import { asyncHandler } from '../../utils/helper';
import {
  createQuestion,
  getQuestionsByTicket,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionsByProject,
  sendQuestionToPO,
  sendQuestionsToPO,
} from '../../services/questionService';

export const index = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await getQuestionsByTicket(req);
  return res.status(status.OK).json(result);
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await getQuestionById(req);
  return res.status(status.OK).json(result);
});

export const store = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await createQuestion(req);
  return res.status(status.CREATED).json(result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await updateQuestion(req);
  return res.status(status.OK).json(result);
});

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  await deleteQuestion(req);
  return res.sendStatus(status.OK);
});

export const getByProject = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await getQuestionsByProject(req);
  return res.status(status.OK).json(result);
});

export const sendToPO = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await sendQuestionToPO(req);
  return res.status(status.OK).json(result);
});

export const sendAllToPO = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  const result = await sendQuestionsToPO(req);
  return res.status(status.OK).json(result);
});

