import { Mongoose, Types } from 'mongoose';
import * as Project from '../model/project';
import * as Ticket from '../model/ticket';
import * as Sprint from '../model/sprint';
import * as Comment from '../model/comment';
import * as Epic from '../model/epic';
import * as Question from '../model/question';
import * as Reply from '../model/reply';
import NotFoundError from '../error/notFound';

export const findProjectForTenant = async (
  dbConnection: Mongoose,
  projectId: string | Types.ObjectId | undefined,
  tenantId: string,
  extraFilter: Record<string, unknown> = {},
) => {
  if (!projectId || !Types.ObjectId.isValid(projectId.toString())) {
    return null;
  }
  return Project.getModel(dbConnection).findOne({
    _id: projectId,
    tenant: tenantId,
    ...extraFilter,
  });
};

export const getProjectIdsForTenant = async (
  dbConnection: Mongoose,
  tenantId: string,
): Promise<Types.ObjectId[]> => {
  const projects = await Project.getModel(dbConnection)
    .find({ tenant: tenantId })
    .select('_id')
    .lean();
  return projects.map((project: { _id: Types.ObjectId }) => project._id);
};

export const assertProjectAccessibleForTenant = async (
  dbConnection: Mongoose,
  projectId: string | Types.ObjectId | undefined,
  tenantId: string,
  extraFilter: Record<string, unknown> = {},
): Promise<void> => {
  const project = await findProjectForTenant(dbConnection, projectId, tenantId, extraFilter);
  if (!project) {
    throw new NotFoundError('Project not found');
  }
};

export const assertTicketAccessibleForTenant = async (
  dbConnection: Mongoose,
  ticketId: string,
  tenantId: string,
): Promise<void> => {
  if (!Types.ObjectId.isValid(ticketId)) {
    throw new NotFoundError('Ticket not found');
  }
  const ticket = await Ticket.getModel(dbConnection).findById(ticketId).select('project').lean();
  if (!ticket?.project) {
    throw new NotFoundError('Ticket not found');
  }
  await assertProjectAccessibleForTenant(dbConnection, ticket.project, tenantId);
};

export const assertSprintAccessibleForTenant = async (
  dbConnection: Mongoose,
  sprintId: string,
  tenantId: string,
): Promise<void> => {
  if (!Types.ObjectId.isValid(sprintId)) {
    throw new NotFoundError('Sprint not found');
  }
  const sprint = await Sprint.getModel(dbConnection).findById(sprintId).select('project').lean();
  if (!sprint?.project) {
    throw new NotFoundError('Sprint not found');
  }
  await assertProjectAccessibleForTenant(dbConnection, sprint.project, tenantId);
};

export const assertCommentAccessibleForTenant = async (
  dbConnection: Mongoose,
  commentId: string,
  tenantId: string,
): Promise<void> => {
  if (!Types.ObjectId.isValid(commentId)) {
    throw new NotFoundError('Comment not found');
  }
  const commentDoc = await Comment.getModel(dbConnection)
    .findById(commentId)
    .select('ticket')
    .lean();
  if (!commentDoc?.ticket) {
    throw new NotFoundError('Comment not found');
  }
  await assertTicketAccessibleForTenant(
    dbConnection,
    commentDoc.ticket.toString(),
    tenantId,
  );
};

export const assertEpicAccessibleForTenant = async (
  dbConnection: Mongoose,
  epicId: string,
  tenantId: string,
): Promise<void> => {
  if (!Types.ObjectId.isValid(epicId)) {
    throw new NotFoundError('Epic not found');
  }
  const epic = await Epic.getModel(dbConnection as any)
    .findById(epicId)
    .select('project')
    .lean();
  if (!epic?.project) {
    throw new NotFoundError('Epic not found');
  }
  await assertProjectAccessibleForTenant(dbConnection, epic.project.toString(), tenantId);
};

export const assertQuestionAccessibleForTenant = async (
  dbConnection: Mongoose,
  questionId: string,
  tenantId: string,
): Promise<void> => {
  if (!Types.ObjectId.isValid(questionId)) {
    throw new NotFoundError('Question not found');
  }
  const question = await Question.getModel(dbConnection)
    .findById(questionId)
    .select('ticket')
    .lean();
  if (!question?.ticket) {
    throw new NotFoundError('Question not found');
  }
  await assertTicketAccessibleForTenant(dbConnection, question.ticket.toString(), tenantId);
};

export const assertReplyAccessibleForTenant = async (
  dbConnection: Mongoose,
  replyId: string,
  tenantId: string,
): Promise<void> => {
  if (!Types.ObjectId.isValid(replyId)) {
    throw new NotFoundError('Reply not found');
  }
  const reply = await Reply.getModel(dbConnection).findById(replyId).select('question').lean();
  if (!reply?.question) {
    throw new NotFoundError('Reply not found');
  }
  await assertQuestionAccessibleForTenant(dbConnection, reply.question.toString(), tenantId);
};
