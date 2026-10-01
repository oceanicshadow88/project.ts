import { Request } from 'express';
const Label = require('../model/label');
const Ticket = require('../model/ticket');
import { Types } from 'mongoose';

const toSlug = (name: string) => name.toLowerCase().replace(/ /g, '-');

const inProject = (projectId: string | Types.ObjectId) => ({ $in: [projectId, null] });

const getProjectId = async (req: Request) => {
  if (req.params.projectId) {
    return req.params.projectId;
  }
  if (req.params.ticketId && Types.ObjectId.isValid(req.params.ticketId)) {
    const ticket = await Ticket.getModel(req.dbConnection).findById(req.params.ticketId);
    if (ticket?.project) {
      return ticket.project;
    }
  }
  return req.body.projectId;
};

export const getLabels = async (req: Request) => {
  const labelModel = Label.getModel(req.dbConnection);
  const { projectId } = req.params;
  if (projectId && Types.ObjectId.isValid(projectId)) {
    return labelModel.find({ tenant: req.tenantId, projectId: inProject(projectId) });
  }
  return labelModel.find({ tenant: req.tenantId });
};

export const findLabelByName = (req: Request, name: string, projectId: string) => {
  return Label.getModel(req.dbConnection)
    .findOne({ name: name.trim(), tenant: req.tenantId, projectId: inProject(projectId) })
    .collation({ locale: 'en', strength: 2 });
};

export const createLabel = async (req: Request) => {
  const labelModel = Label.getModel(req.dbConnection);
  const projectId = await getProjectId(req);
  const name = req.body.name.trim();
  const slug = req.body.slug || toSlug(name);

  let result = await labelModel.findOne({ name, slug, projectId, tenant: req.tenantId });
  if (!result) {
    result = new labelModel({
      name,
      slug,
      color: req.body.color,
      projectId,
      tenant: req.tenantId,
    });
    await result.save();
  }
  return result;
};

export const deleteLabel = (req: Request) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw new Error('Invalid Id');
  }
  Label.getModel(req.dbConnection).findByIdAndRemove(req.params.id);
};

export const updateLabel = (req: Request) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw new Error('Invalid Id');
  }
  return Label.getModel(req.dbConnection).findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
};

export const removeByTicketId = async (req: Request) => {
  const { labelId, ticketId } = req.params;
  const ticketModel = Ticket.getModel(req.dbConnection);
  const ticket = await ticketModel.findById(ticketId);
  ticket.tags = await ticket.tags.filter((item: any) => {
    return item._id.toString() !== labelId;
  });
  return ticket.save();
};
