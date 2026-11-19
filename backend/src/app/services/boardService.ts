/* eslint-disable @typescript-eslint/no-unused-vars */
import { Mongoose } from 'mongoose';
import * as Board from '../model/board';
import * as Ticket from '../model/ticket';
import * as User from '../model/user';
import * as Status from '../model/status';
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

export const addStatusToBoard = async (req: Request) => {
  const { boardId } = req.params;
  const { name } = req.body;
  const boardModel = Board.getModel(req.dbConnection);
  const statusModel = Status.getModel(req.dbConnection);
  const board = await boardModel.findById(boardId);

  if (!board) {
    return null;
  }

  const slug = name.toLowerCase().replace(/\s+/g, '-');

  let status = await statusModel.findOne({ slug, tenant: req.tenantId });
  if (!status) {
    status = await statusModel.create({ name, slug, tenant: req.tenantId });
  }

  const alreadyOnBoard = board.statuses.some(
    (id) => id.toString() === status._id.toString(),
  );

  if (!alreadyOnBoard) {
    board.statuses.push(status._id);
    await board.save();
  }

  return replaceId(await board.populate('statuses'));
};

export const reorderBoardStatuses = async (req: Request) => {
  const { boardId } = req.params;
  const { statusIds } = req.body;
  const boardModel = Board.getModel(req.dbConnection);
  const board = await boardModel.findById(boardId);

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

