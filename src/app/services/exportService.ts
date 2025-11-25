import { ticketSchema } from '../model/ticket';
import * as Ticket from '../model/ticket';
import * as User from '../model/user';
import * as Label from '../model/label';
import * as Type from '../model/type';
import * as Status from '../model/status';
import * as Sprint from '../model/sprint';
import * as Epic from '../model/epic';
import mongoose from 'mongoose';
import { format } from '@fast-csv/format';
import { Response } from 'express';

export const getTicketExportFields = () => {
  return Object.keys(ticketSchema.paths)
    .filter(key => !['_id'].includes(key));
};


export const exportTicketsCsvStream = async (
  projectId: string,
  fields: string[],
  dbConnection: mongoose.Connection,
  res: Response,
  tenantConnection: mongoose.Connection,
) => {
  const TicketModel = Ticket.getModel(dbConnection);
  const labelModel = await Label.getModel(dbConnection);
  const typeModel = await Type.getModel(dbConnection);
  const statusModel = await Status.getModel(dbConnection);
  const sprintModel = await Sprint.getModel(dbConnection);
  const epicModel = await Epic.getModel(dbConnection);
  const allFields = Object.keys(ticketSchema.paths).filter(key => !['_id'].includes(key));
  const exportFields = fields && fields.length > 0 ? fields : allFields;
  const csvStream = format({ headers: exportFields });
  csvStream.pipe(res);
  const userModel = await User.getModel(tenantConnection);

  const cursor = TicketModel
    .find({ project: projectId })
    .select(exportFields.join(' '))
    .populate({ path: 'reporter', select: 'email', model: userModel })
    .populate({ path: 'assign', select: 'email', model: userModel })
    .populate({ path: 'labels', select: 'name', model: labelModel })
    .populate({ path: 'type', select: 'name', model: typeModel })
    .populate({ path: 'status', select: 'name', model: statusModel })
    .populate({ path: 'sprint', select: 'name', model: sprintModel })
    .populate({ path: 'epic', select: 'title', model: epicModel })
    .lean()
    .cursor();

  for await (const doc of cursor) {
    if (doc.reporter && typeof doc.reporter === 'object') {
      doc.reporter = doc.reporter.email ?? '';
    }
    if (doc.assign && typeof doc.assign === 'object') {
      doc.assign = doc.assign.email ?? '';
    }
    if (doc.labels && Array.isArray(doc.labels)) {
      doc.labels = doc.labels.map((label: any) => label?.name ?? '').filter(Boolean).join(', ');
    }
    if (doc.type && typeof doc.type === 'object') {
      doc.type = doc.type.name ?? '';
    }
    if (doc.status && typeof doc.status === 'object') {
      doc.status = doc.status.name ?? '';
    }
    if (doc.sprint && typeof doc.sprint === 'object') {
      doc.sprint = doc.sprint.name ?? '';
    }
    if (doc.epic && typeof doc.epic === 'object') {
      doc.epic = doc.epic.title ?? '';
    }
    csvStream.write(doc);
  }
  csvStream.end();
};