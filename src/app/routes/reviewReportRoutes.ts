import { Router } from 'express';
import {
  submitReviewReport,
  getPendingReviewReports,
  getReviewReportByTicket,
  getOverdueTicketsAdmin,
} from '../controllers/v1/reviewReportController';
import { authenticationTokenMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   POST /api/v1/review-reports/submit
 * @desc    Submit a review report for an overdue ticket
 * @access  Private (authenticated users)
 */
router.post('/submit', authenticationTokenMiddleware, submitReviewReport);

/**
 * @route   GET /api/v1/review-reports/pending
 * @desc    Get pending review reports for the current user
 * @access  Private (authenticated users)
 */
router.get('/pending', authenticationTokenMiddleware, getPendingReviewReports);

/**
 * @route   GET /api/v1/review-reports/ticket/:ticketId
 * @desc    Get review report details by ticket ID
 * @access  Private (authenticated users)
 */
router.get('/ticket/:ticketId', authenticationTokenMiddleware, getReviewReportByTicket);

/**
 * @route   GET /api/v1/review-reports/admin
 * @desc    Admin endpoint to get all overdue tickets and review reports
 * @access  Private (admin users only)
 * @query   status (optional) - filter by status: pending, submitted, overdue
 */
router.get('/admin', authenticationTokenMiddleware, getOverdueTicketsAdmin);

export default router;
