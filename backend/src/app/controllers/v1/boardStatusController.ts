import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import status from 'http-status';
import { addStatusToBoard, reorderBoardStatuses } from '../../services/boardService';
import { asyncHandler } from '../../utils/helper';

// Add a status column to a project's board
export const store = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(status.UNPROCESSABLE_ENTITY).json({});
  }
  const result = await addStatusToBoard(req);
  if (!result) {
    return res.status(status.NOT_FOUND).json({});
  }
  res.status(status.OK).json(result);
});

// Reorder the status columns on a project's board
export const update = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(status.UNPROCESSABLE_ENTITY).json({});
  }
  const result = await reorderBoardStatuses(req);
  if (!result) {
    return res.status(status.BAD_REQUEST).json({});
  }
  res.status(status.OK).json(result);
});
