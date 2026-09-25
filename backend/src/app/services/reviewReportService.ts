import { dataConnectionPool } from '../utils/dbContext';
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

// Resolves the cached per-tenant connection, throwing instead of returning undefined so
// callers don't need to repeat the same not-found check.
const getTenantConnection = (tenantId: string) => {
  const connection = dataConnectionPool[tenantId];
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
  tenantId: string,
): Promise<void> => {
  await OverdueTicketService.submitReviewReport(ticketId, userId, reportContent.trim(), tenantId);
};


// Get pending review reports assigned to the given user
export const getPendingReviewReports = async (userId: string, tenantId: string) => {
  const connection = getTenantConnection(tenantId);
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
  tenantId: string,
) => {
  const connection = getTenantConnection(tenantId);
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
export const getOverdueTicketsAdmin = async (tenantId: string, status?: string) => {
  const connection = getTenantConnection(tenantId);
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
