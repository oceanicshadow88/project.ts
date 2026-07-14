import { Mongoose, ObjectId, Types } from 'mongoose';
import * as Sprint from '../model/sprint';
import * as Ticket from '../model/ticket';

type SprintStatus = 'active' | 'planning' | 'completed';

interface ISprintData {
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  status?: SprintStatus;
  projectId: Types.ObjectId;
  board: string;
}

export const prepareSprintData = (data: ISprintData) => {
  const { projectId, ...rest } = data;
  return {
    project: projectId,
    ...rest,
  };
};

export const findLatestSprints = (dbConnection: Mongoose, projectId: string) => {
  const projectObjectId = new Types.ObjectId(projectId);
  const sprintModel = Sprint.getModel(dbConnection);
  return sprintModel.findLatestSprints(projectObjectId);
};

export const findSprints = async (
  projectId: string,
  dbConnection: Mongoose,
  status?: SprintStatus,
) => {
  const projectObjectId = new Types.ObjectId(projectId);
  const sprintModel = Sprint.getModel(dbConnection);
  const query: any = { project: projectObjectId };
  if (status) {
    query.status = status;
  }
  const result = await sprintModel.find(query).sort({ status: -1, createdAt: -1 });
  return result;
};

export const findSprint = async (
  dbConnection: Mongoose,
  id: string | ObjectId,
): Promise<ISprintData | null> => {
  const sprintModel = Sprint.getModel(dbConnection);
  try {
    const sprint = await sprintModel.findById(id);
    return sprint;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const createSprint = async (dbConnection: Mongoose, data: ISprintData) => {
  const sprintModel = Sprint.getModel(dbConnection);
  const modifiedData = prepareSprintData(data);
  const sprint = new sprintModel(modifiedData);
  await sprint.save();
  return sprint;
};

export const updateSprint = async (
  dbConnection: Mongoose,
  id: string | Types.ObjectId,
  updates: Partial<ISprintData>,
) => {
  const sprintModel = Sprint.getModel(dbConnection);
  const updatedSprint = await sprintModel.findByIdAndUpdate(id, updates, {
    returnDocument: 'after',
  });
  return updatedSprint;
};

export const deleteSprint = async (dbConnection: Mongoose, id: string | Types.ObjectId) => {
  const sprintModel = Sprint.getModel(dbConnection);
  const ticketModel = Ticket.getModel(dbConnection);

  try {
    const sprint = await sprintModel.findByIdAndDelete(id);
    if (!sprint) throw new Error(`Sprint with id ${id} not found.`);
    const result = await ticketModel.deleteMany({ _id: { $in: sprint.ticketId } });
    if (result.deletedCount === 0) throw new Error(`No tickets found for Sprint with id ${id}.`);
    return null;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
