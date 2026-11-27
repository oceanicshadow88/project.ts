import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import httpStatus from 'http-status';
import { replyToChatMessage } from '../../services/aiChatService';
import { asyncHandler } from '../../utils/helper';

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(httpStatus.UNPROCESSABLE_ENTITY);
  }

  const response = await replyToChatMessage(req);
  if (response.status !== httpStatus.OK) {
    return res.sendStatus(response.status);
  }
  return res.status(httpStatus.OK).json(response.result);
});
