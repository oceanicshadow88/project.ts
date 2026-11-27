import { dataConnectionPool } from '../utils/dbContext';
import { PUBLIC_DB } from '../database/connections';
import * as ReviewReport from '../model/reviewReport';
import * as User from '../model/user';
import { OverdueTicketService } from './overdueTicketService';
import NotFoundError from '../error/notFound';

const REVIEW_REPORT_STATUSES = ['pending', 'submitted', 'overdue'];

export class TenantConnectionError extends Error {
  constructor(message = 'Database connection not found') {
    super(message);
    this.name = 'TenantConnectionError';
  }
}

const getPublicDbConnection = () => {
  const connection = dataConnectionPool[PUBLIC_DB];
  if (!connection) {
    throw new TenantConnectionError();
  }
  return connection;
};

// Submit a review report for an overdue ticket
export const submitReviewReport = async (
  ticketId: string,
  userId: string,
  reportContent: string,
): Promise<void> => {
  await OverdueTicketService.submitReviewReport(ticketId, userId, reportContent.trim());
};


// Get pending review reports assigned to the given user
export const getPendingReviewReports = async (userId: string) => {
  const connection = getPublicDbConnection();
  const ReviewReportModel = ReviewReport.getModel(connection);

  return ReviewReportModel.find({
    assignee: userId,
    status: 'pending',
  })
    .populate('ticket', 'title ticketNumber')
    .populate('project', 'name key')
    .sort({ dueDate: 1 })
    .lean();
};

// Get a single review report by ticket id, scoped to the requesting user
export const getReviewReportByTicket = async (
  ticketId: string,
  userId: string,
) => {
  const connection = getPublicDbConnection();
  const ReviewReportModel = ReviewReport.getModel(connection);

  const reviewReport = await ReviewReportModel.findOne({
    ticket: ticketId,
    assignee: userId,
  })
    .populate('ticket', 'title ticketNumber')
    .populate('project', 'name key')
    .lean();

  if (!reviewReport) {
    throw new NotFoundError('Review report not found');
  }

  return reviewReport;
};

// Admin: get all review reports, optionally filtered by status
export const getOverdueTicketsAdmin = async (status?: string) => {
  const connection = getPublicDbConnection();
  const ReviewReportModel = ReviewReport.getModel(connection);
  User.getModel(connection);

  const query: Record<string, string> = {};
  if (status && REVIEW_REPORT_STATUSES.includes(status)) {
    query.status = status;
  }

  return ReviewReportModel.find(query)
    .populate('ticket', 'title ticketNumber')
    .populate('assignee', 'name email')
    .populate('project', 'name key')
    .sort({ dueDate: 1 })
    .lean();
};
