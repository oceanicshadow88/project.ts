import { Request } from 'express';
import * as Question from '../model/question';
import * as User from '../model/user';
import { replaceId } from './replaceService';
import NotFoundError from '../error/notFound';

export const getQuestionsByTicket = async (req: Request) => {
  const { ticketId } = req.params;
  const userModel = await User.getModel(req.tenantsConnection);
  const questionModel = Question.getModel(req.dbConnection);

  const questions = await questionModel
    .find({ ticket: ticketId })
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon' })
    .populate({ path: 'assignee', model: userModel, select: 'name email avatarIcon' })
    .sort({ createdAt: -1 });

  return replaceId(questions);
};

export const getQuestionById = async (req: Request) => {
  const { id } = req.params;
  const userModel = await User.getModel(req.tenantsConnection);
  const questionModel = Question.getModel(req.dbConnection);

  const question = await questionModel
    .findById(id)
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon' })
    .populate({ path: 'assignee', model: userModel, select: 'name email avatarIcon' });

  if (!question) {
    throw new NotFoundError('Question not found');
  }

  return replaceId(question);
};

export const createQuestion = async (req: Request) => {
  const { title, priority, assignee, ticket } = req.body;
  const questionModel = Question.getModel(req.dbConnection);

  const newQuestion = await questionModel.create({
    title,
    priority: priority || 'Medium',
    assignee: assignee || null,
    ticket,
    createdBy: req.userId,
    isResolved: false,
  });

  if (!newQuestion) {
    throw new NotFoundError('Failed to create question');
  }

  const userModel = await User.getModel(req.tenantsConnection);
  const populatedQuestion = await questionModel
    .findById(newQuestion._id)
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon' })
    .populate({ path: 'assignee', model: userModel, select: 'name email avatarIcon' });

  return replaceId(populatedQuestion);
};

export const updateQuestion = async (req: Request) => {
  const { id } = req.params;
  const { title, priority, assignee, isResolved } = req.body;
  const questionModel = Question.getModel(req.dbConnection);

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (priority !== undefined) updateData.priority = priority;
  if (assignee !== undefined) updateData.assignee = assignee;
  if (isResolved !== undefined) updateData.isResolved = isResolved;

  const updatedQuestion = await questionModel.findByIdAndUpdate(id, updateData, { new: true });

  if (!updatedQuestion) {
    throw new NotFoundError('Question not found');
  }

  const userModel = await User.getModel(req.tenantsConnection);
  const populatedQuestion = await questionModel
    .findById(updatedQuestion._id)
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon' })
    .populate({ path: 'assignee', model: userModel, select: 'name email avatarIcon' });

  return replaceId(populatedQuestion);
};

export const deleteQuestion = async (req: Request) => {
  const { id } = req.params;
  const questionModel = Question.getModel(req.dbConnection);

  const deletedQuestion = await questionModel.findByIdAndDelete(id);

  if (!deletedQuestion) {
    throw new NotFoundError('Question not found');
  }
};

