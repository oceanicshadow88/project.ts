import { Request } from 'express';
import mongoose, { Model, Document } from 'mongoose';
import * as Question from '../model/question';
import * as User from '../model/user';
import * as Ticket from '../model/ticket';
import * as Sprint from '../model/sprint';
import * as Reply from '../model/reply';
import * as Project from '../model/project';
import * as Role from '../model/role';
import { replaceId } from './replaceService';
import NotFoundError from '../error/notFound';
import { sendQuestionsToPOEmail, QuestionsToPOEmailData } from '../utils/emailSender';
import { winstonLogger } from '../../bootstrap/logger';
import { QuestionJob } from '../jobs/questionJob';

interface ProductOwner {
  _id: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  active?: boolean;
}

interface QuestionWithId {
  id?: string;
  _id?: string | mongoose.Types.ObjectId;
}

interface ReplyWithId {
  question: string | mongoose.Types.ObjectId | { id?: string; _id?: string | mongoose.Types.ObjectId };
}

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
  const questionIds = questionsWithIds.map((q: QuestionWithId) => q.id || q._id);

  // Get all replies for these questions in a single query
  const allReplies = await replyModel
    .find({ question: { $in: questionIds } })
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' })
    .sort({ createdAt: 1 });

  const repliesWithIds = replaceId(allReplies);

  // Group replies by question ID
  const repliesByQuestion: { [questionId: string]: ReplyWithId[] } = {};
  repliesWithIds.forEach((reply: ReplyWithId) => {
    // reply.question could be an ObjectId, string, or object with id/_id
    let questionId: string;
    if (typeof reply.question === 'string') {
      questionId = reply.question;
    } else if (reply.question && typeof reply.question === 'object' && 'id' in reply.question) {
      questionId = String(reply.question.id);
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

  QuestionJob.dispatch({
    questionId: newQuestion._id.toString(),
  });

  const populatedQuestion = await questionModel
    .findById(newQuestion._id)
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' })
    .populate({ path: 'assignee', model: userModel, select: 'name email avatarIcon _id' });

  return replaceId(populatedQuestion);
};

// Helper function to get Product Owners for a project
const getProductOwnersForProject = async (
  projectId: string,
  userModel: unknown,
  projectModel: unknown,
  roleModel: unknown,
  tenantId: string,
): Promise<ProductOwner[]> => {
  const productOwners: ProductOwner[] = [];

  // Find Product Owner role - check both public roles and tenant-specific roles
  const roleModelTyped = roleModel as Model<Document>;
  const productOwnerRole = await roleModelTyped
    .findOne({
      $or: [
        { name: { $regex: /product.*owner/i }, isPublic: true },
        { slug: { $regex: /product.*owner/i }, isPublic: true },
        { name: { $regex: /product.*owner/i }, tenant: tenantId },
        { slug: { $regex: /product.*owner/i }, tenant: tenantId },
      ],
    })
    .lean();

  if (productOwnerRole && productOwnerRole._id) {
    // Find users with Product Owner role in this project
    const userModelTyped = userModel as Model<Document>;
    const usersWithPORole = await userModelTyped
      .find({
        'projectsRoles.project': new mongoose.Types.ObjectId(projectId),
        'projectsRoles.role': productOwnerRole._id,
        active: true,
      })
      .select('email name')
      .lean();

    for (const user of usersWithPORole) {
      if (user._id && 'email' in user && typeof user.email === 'string') {
        productOwners.push({
          _id: user._id as mongoose.Types.ObjectId,
          email: user.email,
          name: 'name' in user && typeof user.name === 'string' ? user.name : undefined,
        });
      }
    }
  }

  return productOwners;
};

export const updateQuestion = async (req: Request) => {
  const { id } = req.params;
  const { title, priority, assignee, isResolved, waitingForStakeholder } = req.body;
  const questionModel = Question.getModel(req.dbConnection);
  const userModel = await User.getModel(req.tenantsConnection);
  const projectModel = Project.getModel(req.dbConnection);
  const roleModel = Role.getModel(req.dbConnection);
  const ticketModel = Ticket.getModel(req.dbConnection);

  // Get the question before update to check if waitingForStakeholder is changing to true
  const oldQuestion = await questionModel.findById(id).populate({
    path: 'ticket',
    model: ticketModel,
    select: 'project title',
  });

  if (!oldQuestion) {
    throw new NotFoundError('Question not found');
  }

  const updateData: {
    title?: string;
    priority?: string;
    assignee?: string | null;
    isResolved?: boolean;
    waitingForStakeholder?: boolean;
  } = {};
  if (title !== undefined) updateData.title = title;
  if (priority !== undefined) updateData.priority = priority;
  if (assignee !== undefined) updateData.assignee = assignee;
  if (isResolved !== undefined) updateData.isResolved = isResolved;
  if (waitingForStakeholder !== undefined) updateData.waitingForStakeholder = waitingForStakeholder;

  const updatedQuestion = await questionModel.findByIdAndUpdate(id, updateData, { new: true });

  if (!updatedQuestion) {
    throw new NotFoundError('Question not found');
  }

  // Send email if waitingForStakeholder was set to true (changed from false)
  if (
    waitingForStakeholder === true &&
    oldQuestion.waitingForStakeholder === false &&
    !updatedQuestion.isResolved
  ) {
    try {
      const ticket = oldQuestion.ticket;
      if (ticket && typeof ticket === 'object' && 'project' in ticket) {
        const projectId = ticket.project?.toString();
        if (projectId) {
          const productOwners = await getProductOwnersForProject(
            projectId,
            userModel,
            projectModel,
            roleModel,
            req.tenantId,
          );

          if (productOwners.length > 0) {
            // Get all questions awaiting PO response for this project
            const allTickets = await ticketModel.find({ project: projectId }).select('_id').lean();
            const ticketIds = allTickets.map((t: { _id: mongoose.Types.ObjectId }) => t._id);

            if (ticketIds.length > 0) {
              const allAwaitingQuestions = await questionModel
                .find({
                  ticket: { $in: ticketIds },
                  waitingForStakeholder: true,
                  isResolved: false,
                })
                .select('priority')
                .lean();

              const totalQuestionsCount = allAwaitingQuestions.length;
              const urgentQuestionsCount = allAwaitingQuestions.filter(
                (q: { priority: string }) => q.priority === 'Highest' || q.priority === 'High',
              ).length;

              const isUrgent = updatedQuestion.priority === 'Highest' || updatedQuestion.priority === 'High';
              const emailTitle = isUrgent
                ? `You have 1 Urgent Question: ${updatedQuestion.title}`
                : `You have 1 New Question: ${updatedQuestion.title}`;

              const emailData: QuestionsToPOEmailData = {
                questionsCount: totalQuestionsCount,
                urgentQuestionsCount,
                projectUrl: `${req.domain}/projects/${projectId}/questions/po-reply`,
                emailTitle,
              };
              // Send email to all Product Owners
              for (const po of productOwners) {
                if (po.email) {
                  await sendQuestionsToPOEmail([po.email], emailData);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      // Log error but don't fail the update
      winstonLogger.error('Failed to send email notification for question:', error);
    }
  }

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

  const ticketIds = tickets.map((ticket: { _id: mongoose.Types.ObjectId }) => ticket._id);

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
  const questionIds = questionsWithIds.map((q: QuestionWithId) => q.id || q._id);

  // Get all replies for these questions in a single query
  const allReplies = await replyModel
    .find({ question: { $in: questionIds } })
    .populate({ path: 'createdBy', model: userModel, select: 'name email avatarIcon _id' })
    .sort({ createdAt: 1 });

  const repliesWithIds = replaceId(allReplies);

  // Group replies by question ID
  const repliesByQuestion: { [questionId: string]: ReplyWithId[] } = {};
  repliesWithIds.forEach((reply: ReplyWithId) => {
    // reply.question could be an ObjectId, string, or object with id/_id
    let questionId: string;
    if (typeof reply.question === 'string') {
      questionId = reply.question;
    } else if (reply.question && typeof reply.question === 'object' && 'id' in reply.question) {
      questionId = String(reply.question.id);
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


export const sendQuestionsToPO = async (req: Request) => {
  const { projectId } = req.params;
  const { email, questionIds } = req.body;
  const questionModel = Question.getModel(req.dbConnection);
  const ticketModel = Ticket.getModel(req.dbConnection);

  if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
    throw new Error('Question IDs are required');
  }

  // Get all tickets for the project to find all questions
  const tickets = await ticketModel.find({ project: projectId }).select('_id').lean();
  const ticketIds = tickets.map((ticket: { _id: mongoose.Types.ObjectId }) => ticket._id);

  if (ticketIds.length === 0) {
    throw new Error('No tickets found for this project');
  }

  // Get all questions for this project
  const allProjectQuestions = await questionModel.find({ ticket: { $in: ticketIds } }).select('_id');
  const allQuestionIds = allProjectQuestions.map((q: { _id: mongoose.Types.ObjectId }) => q._id.toString());

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
    (q: { priority: string }) => q.priority === 'Highest' || q.priority === 'High',
  ).length;

  if (questionsCount === 0) {
    throw new Error('No questions found');
  }

  const emailTo = [email];

  const emailData: QuestionsToPOEmailData = {
    questionsCount,
    urgentQuestionsCount,
    projectUrl: `${req.domain}/projects/${projectId}/questions/po-reply`,
    emailTitle: `Reminder: ${questionsCount} Question(s) Remaining - ${urgentQuestionsCount} Urgent`,
  };

  await sendQuestionsToPOEmail(emailTo, emailData);

  return { message: 'All questions sent to Product Owner successfully' };
};

