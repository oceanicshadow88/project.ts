import { Request } from 'express';
import * as Prompt from '../model/prompt';
import { replaceId } from './replaceService';
import NotFoundError from '../error/notFound';
import * as User from '../model/user';

export const createPrompt = async (req: Request) => {
  const { title, prompt } = req.body;
  const connection = (req as any).dbConnection;
  const tenantsConnection = (req as any).tenantsConnection;
  const tenantId = (req as any).tenantId;
  const userId = (req as any).userId;
  
  const PromptModel = Prompt.getModel(connection);
  const newPrompt = new PromptModel({
    title,
    prompt,
    tenant: tenantId,
    createdBy: userId,
  });

  await newPrompt.save();
  
  // Populate the createdBy field before returning
  const userModel = await User.getModel(tenantsConnection);
  const populatedPrompt = await PromptModel.findById(newPrompt._id)
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' });
    
  return replaceId(populatedPrompt?.toJSON());
};

export const getPrompts = async (req: Request) => {
  const connection = (req as any).dbConnection;
  const tenantsConnection = (req as any).tenantsConnection;
  const tenantId = (req as any).tenantId;
  const PromptModel = Prompt.getModel(connection);
  const userModel = await User.getModel(tenantsConnection);
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const sortBy = (req.query.sort_by as string) || 'createdAt';
  const order = (req.query.order as string) || 'desc';
  
  const skip = (page - 1) * limit;
  let query: any = { tenant: tenantId };

  if (search) {
    query = {
      tenant: tenantId,
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { prompt: { $regex: search, $options: 'i' } },
      ],
    };
  }

  const sortOptions: any = {};
  sortOptions[sortBy] = order === 'desc' ? -1 : 1;

  const total = await PromptModel.countDocuments(query);
  const prompts = await PromptModel.find(query)
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' })
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  const results = prompts.map((prompt) => replaceId(prompt.toJSON()));

  return {
    data: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

export const getPromptById = async (req: Request) => {
  const { id } = req.params;
  const connection = (req as any).dbConnection;
  const tenantsConnection = (req as any).tenantsConnection;
  const tenantId = (req as any).tenantId;
  
  const PromptModel = Prompt.getModel(connection);
  const userModel = await User.getModel(tenantsConnection);
  const prompt = await PromptModel.findOne({ _id: id, tenant: tenantId })
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' });

  if (!prompt) {
    throw new NotFoundError('Prompt not found');
  }

  return replaceId(prompt.toJSON());
};

export const updatePrompt = async (req: Request) => {
  const { id } = req.params;
  const { title, prompt } = req.body;
  const connection = (req as any).dbConnection;
  const tenantsConnection = (req as any).tenantsConnection;
  const tenantId = (req as any).tenantId;
  
  const PromptModel = Prompt.getModel(connection);
  const userModel = await User.getModel(tenantsConnection);
  
  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (prompt !== undefined) updateData.prompt = prompt;
  
  const updatedPrompt = await PromptModel.findOneAndUpdate(
    { _id: id, tenant: tenantId },
    updateData,
    { new: true },
  ).populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' });

  if (!updatedPrompt) {
    throw new NotFoundError('Prompt not found');
  }

  return replaceId(updatedPrompt.toJSON());
};

export const deletePrompt = async (req: Request) => {
  const { id } = req.params;
  const connection = (req as any).dbConnection;
  const tenantId = (req as any).tenantId;
  
  const PromptModel = Prompt.getModel(connection);
  const deletedPrompt = await PromptModel.findOneAndDelete({ _id: id, tenant: tenantId });

  if (!deletedPrompt) {
    throw new NotFoundError('Prompt not found');
  }

  return true;
};
