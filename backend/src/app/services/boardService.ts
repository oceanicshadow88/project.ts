/* eslint-disable @typescript-eslint/no-unused-vars */
import { Mongoose } from 'mongoose';
import * as Board from '../model/board';
import * as Ticket from '../model/ticket';
import * as User from '../model/user';
import * as Status from '../model/status';
import * as Sprint from '../model/sprint';
import { replaceId } from './replaceService';
import { Request } from 'express';

export const findTicketsByBoardId = async (
  sprintId: string,
  dbConnection: Mongoose,
  filter: any,
  tenantConnection: any,
) => {
  const ticketModel = Ticket.getModel(dbConnection);
  const UserFields = 'avatarIcon name email';
  const userModel = await User.getModel(tenantConnection);

  const tickets = await ticketModel.find({ ...filter, sprint: sprintId }).populate({
    path: 'assign',
    model: userModel,
    select: UserFields,
  });

  return tickets;
};

export const getBoard = async (req: Request) => {
  const { boardId } = req.params;
  const boardModel = Board.getModel(req.dbConnection);
  const board = await boardModel.findById(boardId).populate('statuses');
  return replaceId(board);
};

export const getAllBoards = async (req: Request) => {
  const boardModel = Board.getModel(req.dbConnection);
  const board = await boardModel.find({ tenant: req.tenantId }).populate('statuses');
  return replaceId(board);
};

// A board with its statuses populated, after replaceId has turned _id into id
export interface IProjectBoard {
  id: string;
  title: string;
  statuses: (Status.IStatus & { id: string })[];
}

// Boards owned by the project, plus boards its sprints use (older boards have no project field)
export const getProjectBoards = async (
  req: Request,
  projectId: string,
  sprintBoardIds: string[],
): Promise<IProjectBoard[]> => {
  const boardModel = Board.getModel(req.dbConnection);
  const boards = await boardModel
    .find({
      tenant: req.tenantId,
      $or: [{ project: projectId }, { _id: { $in: sprintBoardIds } }],
    })
    .populate('statuses');
  return replaceId(boards);
};

// Only find the board if it belongs to this tenant and project
// (older boards have no project field, so allow them if one of the project's sprints uses them)
const findProjectBoard = async (req: Request) => {
  const { boardId, projectId } = req.params;
  const boardModel = Board.getModel(req.dbConnection);
  const sprintModel = Sprint.getModel(req.dbConnection);
  const board = await boardModel.findOne({ _id: boardId, tenant: req.tenantId });

  if (!board) {
    return null;
  }
  if (board.project) {
    return board.project.toString() === projectId ? board : null;
  }
  const isUsedByProject = await sprintModel.exists({ project: projectId, board: boardId });
  return isUsedByProject ? board : null;
};

export const addStatusToBoard = async (req: Request) => {
  const { name } = req.body;
  const statusModel = Status.getModel(req.dbConnection);
  const board = await findProjectBoard(req);

  if (!board) {
    return null;
  }

  const slug = name.toLowerCase().replace(/\s+/g, '-');

  let status = await statusModel.findOne({ slug, tenant: req.tenantId });
  if (!status) {
    status = await statusModel.create({ name, slug, tenant: req.tenantId });
  }

  const isOnBoard = board.statuses.some(
    (id) => id.toString() === status._id.toString(),
  );

  if (!isOnBoard) {
    board.statuses.push(status._id);
    await board.save();
  }

  return replaceId(await board.populate('statuses'));
};

export const reorderBoardStatuses = async (req: Request) => {
  const { statusIds } = req.body;
  const board = await findProjectBoard(req);

  if (!board) {
    return null;
  }

  const currentStatusIds = board.statuses.map((id) => id.toString());

  const isSameSet =
    statusIds.length === currentStatusIds.length &&
    new Set(statusIds).size === statusIds.length &&
    statusIds.every((id: string) => currentStatusIds.includes(id));

  if (!isSameSet) {
    return null;
  }

  board.statuses = statusIds;
  await board.save();

  return replaceId(await board.populate('statuses'));
};
