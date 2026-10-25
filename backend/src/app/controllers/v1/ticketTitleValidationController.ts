import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import httpStatus from 'http-status';
import { validateTicketTitle } from '../../services/ticketTitleValidationService';
import { asyncHandler } from '../../utils/helper';

export const validateTitle = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(httpStatus.UNPROCESSABLE_ENTITY);
  }

  const response = await validateTicketTitle(req);
  if (response.status !== httpStatus.OK) {
    return res.sendStatus(response.status);
  }
  return res.status(httpStatus.OK).json(response.result);
});
