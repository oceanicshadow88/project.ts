import { Request } from 'express';
import mongoose from 'mongoose';
import * as Question from '../model/question';
import * as User from '../model/user';
import * as Ticket from '../model/ticket';
import * as Sprint from '../model/sprint';
import * as Reply from '../model/reply';
import * as Project from '../model/project';
import * as Role from '../model/role';
import { replaceId } from './replaceService';
import NotFoundError from '../error/notFound';
import { emailRecipientTemplate } from '../utils/emailSender';

export const getQuestionsByTicket = async (req: Request) => {
  const { ticketId } = req.params;
  const userModel = await User.getModel(req.tenantsConnection);
  const questionModel = Question.getModel(req.dbConnection);
  const replyModel = Reply.getModel(req.dbConnection);

  const questions = await questionModel
    .find({ ticket: ticketId })
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' })
    .populate({ path: 'assignee', model: userModel, select: 'name email avatarIcon _id' })
    .sort({ createdAt: -1 });

  const questionsWithIds = replaceId(questions);
  const questionIds = questionsWithIds.map((q: any) => q.id || q._id);

  // Get all replies for these questions in a single query
  const allReplies = await replyModel
    .find({ question: { $in: questionIds } })
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' })
    .sort({ createdAt: 1 });

  const repliesWithIds = replaceId(allReplies);

  // Group replies by question ID
  const repliesByQuestion: { [questionId: string]: any[] } = {};
  repliesWithIds.forEach((reply: any) => {
    // reply.question could be an ObjectId, string, or object with id/_id
    let questionId: string;
    if (typeof reply.question === 'string') {
      questionId = reply.question;
    } else if (reply.question?.id) {
      questionId = reply.question.id;
    } else if (reply.question?._id) {
      questionId = reply.question._id.toString();
    } else if (reply.question) {
      questionId = reply.question.toString();
    } else {
      return; // Skip if no question ID
    }
    if (!repliesByQuestion[questionId]) {
      repliesByQuestion[questionId] = [];
    }
    repliesByQuestion[questionId].push(reply);
  });

  // Attach replies to each question
  const questionsWithReplies = questionsWithIds.map((question: any) => {
    const questionId = question.id || question._id;
    return {
      ...question,
      replies: repliesByQuestion[questionId] || [],
    };
  });

  return questionsWithReplies;
};

export const getQuestionById = async (req: Request) => {
  const { id } = req.params;
  const userModel = await User.getModel(req.tenantsConnection);
  const questionModel = Question.getModel(req.dbConnection);

  const question = await questionModel
    .findById(id)
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' })
    .populate({ path: 'assignee', model: userModel, select: 'name email avatarIcon _id' });

  if (!question) {
    throw new NotFoundError('Question not found');
  }

  return replaceId(question);
};

export const createQuestion = async (req: Request) => {
  const { title, priority, assignee, ticket } = req.body;
  const questionModel = Question.getModel(req.dbConnection);
  const ticketModel = Ticket.getModel(req.dbConnection);
  const sprintModel = Sprint.getModel(req.dbConnection);
  const userModel = await User.getModel(req.tenantsConnection);
  const projectModel = Project.getModel(req.dbConnection);
  const roleModel = Role.getModel(req.dbConnection);

  // Get ticket to check sprint status
  const ticketDoc = await ticketModel.findById(ticket).populate({
    path: 'sprint',
    model: sprintModel,
    select: 'status',
  });

  // Determine priority: if ticket is in active sprint, set to Highest
  let finalPriority = priority || 'Medium';
  if (ticketDoc?.sprint && typeof ticketDoc.sprint === 'object' && 'status' in ticketDoc.sprint) {
    if (ticketDoc.sprint.status === 'active') {
      finalPriority = 'Highest';
    }
  }

  // Determine assignee: if "automatic", find Product Owner or project owner
  let finalAssignee: string | null = assignee && assignee !== 'automatic' ? assignee : null;
  if (assignee === 'automatic') {
    // Get project ID from ticket
    const ticketWithProject = await ticketModel.findById(ticket).select('project').lean();
    const projectId = ticketWithProject?.project;

    if (projectId) {
      // Find Product Owner role
      const productOwnerRole = await roleModel
        .findOne({
          $or: [
            { name: { $regex: /product.*owner/i } },
            { slug: { $regex: /product.*owner/i } },
          ],
        })
        .lean();

      if (productOwnerRole) {
        // Find users with Product Owner role in this project
        const usersWithPORole = await userModel
          .find({
            'projectsRoles.project': new mongoose.Types.ObjectId(projectId),
            'projectsRoles.role': productOwnerRole._id,
          })
          .select('_id')
          .lean();

        if (usersWithPORole.length > 0) {
          // Assign to first Product Owner
          finalAssignee = usersWithPORole[0]._id.toString();
        }
      }

      // If no Product Owner found, assign to project owner
      if (!finalAssignee) {
        const project = await projectModel.findById(projectId).select('owner').lean();
        if (project?.owner) {
          finalAssignee = project.owner.toString();
        }
      }
    }
  }

  const newQuestion = await questionModel.create({
    title,
    priority: finalPriority,
    assignee: finalAssignee,
    ticket,
    createdBy: req.userId,
    isResolved: false,
    waitingForStakeholder: false,
  });

  if (!newQuestion) {
    throw new NotFoundError('Failed to create question');
  }

  const populatedQuestion = await questionModel
    .findById(newQuestion._id)
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' })
    .populate({ path: 'assignee', model: userModel, select: 'name email avatarIcon _id' });

  return replaceId(populatedQuestion);
};

export const updateQuestion = async (req: Request) => {
  const { id } = req.params;
  const { title, priority, assignee, isResolved, waitingForStakeholder } = req.body;
  const questionModel = Question.getModel(req.dbConnection);

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (priority !== undefined) updateData.priority = priority;
  if (assignee !== undefined) updateData.assignee = assignee;
  if (isResolved !== undefined) updateData.isResolved = isResolved;
  if (waitingForStakeholder !== undefined) updateData.waitingForStakeholder = waitingForStakeholder;

  const updatedQuestion = await questionModel.findByIdAndUpdate(id, updateData, { new: true });

  if (!updatedQuestion) {
    throw new NotFoundError('Question not found');
  }

  const userModel = await User.getModel(req.tenantsConnection);
  const populatedQuestion = await questionModel
    .findById(updatedQuestion._id)
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' })
    .populate({ path: 'assignee', model: userModel, select: 'name email avatarIcon _id' });

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

export const getQuestionsByProject = async (req: Request) => {
  const { projectId } = req.params;
  const userModel = await User.getModel(req.tenantsConnection);
  const questionModel = Question.getModel(req.dbConnection);
  const ticketModel = Ticket.getModel(req.dbConnection);
  const sprintModel = Sprint.getModel(req.dbConnection);
  const replyModel = Reply.getModel(req.dbConnection);

  // Get all tickets for the project
  const tickets = await ticketModel.find({ project: projectId }).select('_id sprint').lean();

  const ticketIds = tickets.map((ticket: any) => ticket._id);

  if (ticketIds.length === 0) {
    return [];
  }

  // Get all questions for these tickets, populate ticket info
  const questions = await questionModel
    .find({ ticket: { $in: ticketIds } })
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' })
    .populate({ path: 'assignee', model: userModel, select: 'name email avatarIcon _id' })
    .populate({
      path: 'ticket',
      model: ticketModel,
      select: 'title sprint',
      populate: {
        path: 'sprint',
        model: sprintModel,
        select: 'name status',
      },
    })
    .sort({ createdAt: 1 }); // Oldest first

  const questionsWithIds = replaceId(questions);
  const questionIds = questionsWithIds.map((q: any) => q.id || q._id);

  // Get all replies for these questions in a single query
  const allReplies = await replyModel
    .find({ question: { $in: questionIds } })
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' })
    .sort({ createdAt: 1 });

  const repliesWithIds = replaceId(allReplies);

  // Group replies by question ID
  const repliesByQuestion: { [questionId: string]: any[] } = {};
  repliesWithIds.forEach((reply: any) => {
    // reply.question could be an ObjectId, string, or object with id/_id
    let questionId: string;
    if (typeof reply.question === 'string') {
      questionId = reply.question;
    } else if (reply.question?.id) {
      questionId = reply.question.id;
    } else if (reply.question?._id) {
      questionId = reply.question._id.toString();
    } else if (reply.question) {
      questionId = reply.question.toString();
    } else {
      return; // Skip if no question ID
    }
    if (!repliesByQuestion[questionId]) {
      repliesByQuestion[questionId] = [];
    }
    repliesByQuestion[questionId].push(reply);
  });

  // Attach replies to each question
  const questionsWithReplies = questionsWithIds.map((question: any) => {
    const questionId = question.id || question._id;
    return {
      ...question,
      replies: repliesByQuestion[questionId] || [],
    };
  });

  return questionsWithReplies;
};

export const sendQuestionToPO = async (req: Request) => {
  const { id } = req.params;
  const { email } = req.body;
  const questionModel = Question.getModel(req.dbConnection);
  const userModel = await User.getModel(req.tenantsConnection);
  const ticketModel = Ticket.getModel(req.dbConnection);

  const question = await questionModel
    .findById(id)
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' })
    .populate({ path: 'assignee', model: userModel, select: 'name email avatarIcon _id' })
    .populate({
      path: 'ticket',
      model: ticketModel,
      select: 'title project',
    });

  if (!question) {
    throw new NotFoundError('Question not found');
  }

  const emailTo = [email];

  const ticket = typeof question.ticket === 'object' && question.ticket ? question.ticket : null;
  const ticketTitle = ticket && 'title' in ticket ? ticket.title : 'Unknown Ticket';

  const createdBy = question.createdBy && typeof question.createdBy === 'object' && 'name' in question.createdBy ? question.createdBy.name : 'Unknown';
  const emailData = {
    questionTitle: question.title,
    questionId: question._id.toString(),
    createdBy,
    ticketTitle,
    projectUrl: `${req.protocol}://${req.get('host')}/projects/${ticket && 'project' in ticket ? ticket.project : ''}/questions`,
  };

  await emailRecipientTemplate(emailTo, emailData, 'QuestionsToPO');

  return { message: 'Question sent to Product Owner successfully' };
};

export const sendQuestionsToPO = async (req: Request) => {
  const { projectId } = req.params;
  const { email, questionIds } = req.body;
  const questionModel = Question.getModel(req.dbConnection);
  const userModel = await User.getModel(req.tenantsConnection);
  const ticketModel = Ticket.getModel(req.dbConnection);

  if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
    throw new Error('Question IDs are required');
  }

  // Get all tickets for the project to find all questions
  const tickets = await ticketModel.find({ project: projectId }).select('_id').lean();
  const ticketIds = tickets.map((ticket: any) => ticket._id);

  if (ticketIds.length === 0) {
    throw new Error('No tickets found for this project');
  }

  // Get all questions for this project
  const allProjectQuestions = await questionModel.find({ ticket: { $in: ticketIds } }).select('_id');
  const allQuestionIds = allProjectQuestions.map((q: any) => q._id.toString());

  // Update waitingForStakeholder: true for selected questions, false for others
  const selectedQuestionIds = questionIds.map((id: string) => new mongoose.Types.ObjectId(id));
  const unselectedQuestionIds = allQuestionIds
    .filter((id: string) => !questionIds.includes(id))
    .map((id: string) => new mongoose.Types.ObjectId(id));

  // Update selected questions to waitingForStakeholder: true
  if (selectedQuestionIds.length > 0) {
    await questionModel.updateMany(
      { _id: { $in: selectedQuestionIds } },
      { $set: { waitingForStakeholder: true } },
    );
  }

  // Update unselected questions to waitingForStakeholder: false
  if (unselectedQuestionIds.length > 0) {
    await questionModel.updateMany(
      { _id: { $in: unselectedQuestionIds } },
      { $set: { waitingForStakeholder: false } },
    );
  }

  // Count questions and urgent questions for email
  const questions = await questionModel
    .find({ _id: { $in: selectedQuestionIds } })
    .select('priority')
    .lean();

  const questionsCount = questions.length;
  const urgentQuestionsCount = questions.filter(
    (q: any) => q.priority === 'Highest' || q.priority === 'High',
  ).length;

  if (questionsCount === 0) {
    throw new Error('No questions found');
  }

  const emailTo = [email];

  const emailData = {
    questionsCount,
    urgentQuestionsCount,
    projectUrl: `${req.protocol}://${req.get('host')}/projects/${projectId}/questions/po-reply`,
  };

  await emailRecipientTemplate(emailTo, emailData, 'QuestionsToPO');

  return { message: 'All questions sent to Product Owner successfully' };
};

