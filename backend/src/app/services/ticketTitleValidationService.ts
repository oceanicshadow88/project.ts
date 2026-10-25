import { Request } from 'express';
import httpStatus from 'http-status';
import * as Ticket from '../model/ticket';
import * as Project from '../model/project';
import type { TicketTitleValidationResult } from '../types/ticketTitleValidationResult';
import { callValidateTicketTitleTool } from './mcpService';

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

  const project = await Project.getModel(req.dbConnection).findOne({
    _id: ticket.project,
    tenant: req.tenantId,
    isDelete: false,
  });
  if (!project) return { status: httpStatus.NOT_FOUND };

  const accessibleProjectIds =
    req.user?.projectsRoles?.filter((pr) => pr.project).map((pr) => pr.project.toString()) ?? [];

  if (req.ownerId !== req.userId) {
    if (!accessibleProjectIds.includes(project.id)) return { status: httpStatus.FORBIDDEN };
  }

  const result = await callValidateTicketTitleTool(ticket.title);
  return { status: httpStatus.OK, result: { title: ticket.title, ...result } };
};
