import { Request, Response } from 'express';
import { OverdueTicketService } from '../../services/overdueTicketService';
import { dataConnectionPool } from '../../utils/dbContext';
import * as ReviewReport from '../../model/reviewReport';
import { winstonLogger } from '../../../bootstrap/logger';

/**
 * Submit a review report for an overdue ticket
 */
export const submitReviewReport = async (req: Request, res: Response) => {
  try {
    const { ticketId, reportContent } = req.body;
    const tenantId = req.tenantId;
    const userId = req.userId;

    if (!ticketId || !reportContent) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID and report content are required',
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant information not found',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    await OverdueTicketService.submitReviewReport(
      ticketId,
      userId,
      reportContent.trim(),
      tenantId,
    );

    res.status(200).json({
      success: true,
      message: 'Review report submitted successfully',
    });
  } catch (error) {
    winstonLogger.error('Error submitting review report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get pending review reports for the current user
 */
export const getPendingReviewReports = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant information not found',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const connection = dataConnectionPool[tenantId];
    if (!connection) {
      return res.status(400).json({
        success: false,
        message: 'Database connection not found',
      });
    }

    const ReviewReportModel = ReviewReport.getModel(connection);
    
    const pendingReports = await ReviewReportModel.find({
      assignee: userId,
      status: 'pending',
    })
      .populate('ticket', 'title ticketNumber')
      .populate('project', 'name key')
      .sort({ dueDate: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: pendingReports,
    });
  } catch (error) {
    winstonLogger.error('Error fetching pending review reports:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get review report details by ticket ID
 */
export const getReviewReportByTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const tenantId = req.tenantId;
    const userId = req.userId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant information not found',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const connection = dataConnectionPool[tenantId];
    if (!connection) {
      return res.status(400).json({
        success: false,
        message: 'Database connection not found',
      });
    }

    const ReviewReportModel = ReviewReport.getModel(connection);
    
    const reviewReport = await ReviewReportModel.findOne({
      ticket: ticketId,
      assignee: userId,
    })
      .populate('ticket', 'title ticketNumber')
      .populate('project', 'name key')
      .lean();

    if (!reviewReport) {
      return res.status(404).json({
        success: false,
        message: 'Review report not found',
      });
    }

    res.status(200).json({
      success: true,
      data: reviewReport,
    });
  } catch (error) {
    winstonLogger.error('Error fetching review report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Admin endpoint: Get all overdue tickets and review reports
 */
export const getOverdueTicketsAdmin = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { status } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant information not found',
      });
    }

    const connection = dataConnectionPool[tenantId];
    if (!connection) {
      return res.status(400).json({
        success: false,
        message: 'Database connection not found',
      });
    }

    const ReviewReportModel = ReviewReport.getModel(connection);
    
    const query: any = {};
    if (status && ['pending', 'submitted', 'overdue'].includes(status as string)) {
      query.status = status;
    }

    const reviewReports = await ReviewReportModel.find(query)
      .populate('ticket', 'title ticketNumber')
      .populate('assignee', 'name email')
      .populate('project', 'name key')
      .sort({ dueDate: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: reviewReports,
    });
  } catch (error) {
    winstonLogger.error('Error fetching overdue tickets for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
