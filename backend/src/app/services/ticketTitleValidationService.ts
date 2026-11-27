import { Request } from 'express';
import httpStatus from 'http-status';
import * as Ticket from '../model/ticket';
import type { TicketTitleValidationResult } from '../types/ticketTitleValidationResult';
import { validateTicketTitleByClaude } from './claudeService';
import { getProjectAccessStatus } from './projectAccessService';

type TicketTitleValidationResponse = {
  status: number;
  result?: { title: string } & TicketTitleValidationResult;
};

export const validateTicketTitle = async (req: Request): Promise<TicketTitleValidationResponse> => {
  const ticket = await Ticket.getModel(req.dbConnection).findOne({
    _id: req.params.id,
    isActive: true,
  });
  if (!ticket) return { status: httpStatus.NOT_FOUND };

  const accessStatus = await getProjectAccessStatus(req, ticket.project);
  if (accessStatus !== httpStatus.OK) return { status: accessStatus };

  const result = await validateTicketTitleByClaude(ticket.title);
  return { status: httpStatus.OK, result: { title: ticket.title, ...result } };
};
