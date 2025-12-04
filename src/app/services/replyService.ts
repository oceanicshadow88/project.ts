import { Request } from 'express';
import * as Reply from '../model/reply';
import * as Question from '../model/question';
import * as User from '../model/user';
import { replaceId } from './replaceService';
import NotFoundError from '../error/notFound';

export const getRepliesByQuestion = async (req: Request) => {
  const { questionId } = req.params;
  const userModel = await User.getModel(req.tenantsConnection);
  const replyModel = Reply.getModel(req.dbConnection);

  const replies = await replyModel
    .find({ question: questionId })
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon' })
    .sort({ createdAt: 1 });

  return replaceId(replies);
};

export const createReply = async (req: Request) => {
  const { content, question } = req.body;
  const replyModel = Reply.getModel(req.dbConnection);
  const questionModel = Question.getModel(req.dbConnection);

  // Verify question exists
  const questionExists = await questionModel.findById(question);
  if (!questionExists) {
    throw new NotFoundError('Question not found');
  }

  const newReply = await replyModel.create({
    content,
    question,
    createdBy: req.userId,
  });

  if (!newReply) {
    throw new NotFoundError('Failed to create reply');
  }

  const userModel = await User.getModel(req.tenantsConnection);
  const populatedReply = await replyModel
    .findById(newReply._id)
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon' });

  return replaceId(populatedReply);
};

export const updateReply = async (req: Request) => {
  const { id } = req.params;
  const { content } = req.body;
  const replyModel = Reply.getModel(req.dbConnection);

  const updatedReply = await replyModel.findByIdAndUpdate(
    id,
    { content },
    { new: true },
  );

  if (!updatedReply) {
    throw new NotFoundError('Reply not found');
  }

  const userModel = await User.getModel(req.tenantsConnection);
  const populatedReply = await replyModel
    .findById(updatedReply._id)
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon' });

  return replaceId(populatedReply);
};

export const deleteReply = async (req: Request) => {
  const { id } = req.params;
  const replyModel = Reply.getModel(req.dbConnection);

  const deletedReply = await replyModel.findByIdAndDelete(id);

  if (!deletedReply) {
    throw new NotFoundError('Reply not found');
  }
};

