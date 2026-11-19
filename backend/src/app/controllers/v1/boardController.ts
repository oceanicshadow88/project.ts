import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { addStatusToBoard, reorderBoardStatuses, findTicketsByBoardId, getAllBoards, getBoard } from '../../services/boardService';
import { asyncHandler } from '../../utils/helper';
import status from 'http-status';
import { buildSearchTicketQuery } from '../../utils/searchTicketQueryUtils';

export const index = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(status.UNPROCESSABLE_ENTITY).json({});
  }
  const result = await getAllBoards(req);
  res.status(status.OK).json(result);
});

// GET one
export const show = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(status.UNPROCESSABLE_ENTITY).json({});
  }
  const result = await getBoard(req);
  res.status(status.OK).json(result);
});

export const showBoard = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(status.UNPROCESSABLE_ENTITY).json({});
  }
  const result = await getBoard(req);
  res.status(status.OK).json(result);
});

export const showBoardTickets = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(status.UNPROCESSABLE_ENTITY).json({});
  }
  const result = await findTicketsByBoardId(
    req.params.sprintId,
    req.dbConnection,
    buildSearchTicketQuery(req),
    req.tenantsConnection,
  );
  res.status(status.OK).json(result);
});

export const addStatus = asyncHandler(async (req: Request, res: Response) => {
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

export const reorderStatus = asyncHandler(async (req: Request, res: Response) => {
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
