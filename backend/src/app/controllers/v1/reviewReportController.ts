import { Request, Response } from 'express';
import * as ReviewReportService from '../../services/reviewReportService';
import { TenantConnectionError } from '../../services/reviewReportService';
import NotFoundError from '../../error/notFound';
import { winstonLogger } from '../../../bootstrap/logger';

// Submit a review report for an overdue ticket
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

    // All DB/model logic now lives in reviewReportService.
    await ReviewReportService.submitReviewReport(ticketId, userId, reportContent, tenantId);

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

// Get pending review reports for the current user
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

    const pendingReports = await ReviewReportService.getPendingReviewReports(userId, tenantId);

    res.status(200).json({
      success: true,
      data: pendingReports,
    });
  } catch (error) {
    if (error instanceof TenantConnectionError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    winstonLogger.error('Error fetching pending review reports:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get review report details by ticket ID
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

    const reviewReport = await ReviewReportService.getReviewReportByTicket(
      ticketId,
      userId,
      tenantId,
    );

    res.status(200).json({
      success: true,
      data: reviewReport,
    });
  } catch (error) {
    if (error instanceof TenantConnectionError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: 'Review report not found',
      });
    }
    winstonLogger.error('Error fetching review report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Admin endpoint: Get all overdue tickets and review reports
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

    const reviewReports = await ReviewReportService.getOverdueTicketsAdmin(
      tenantId,
      status as string,
    );

    res.status(200).json({
      success: true,
      data: reviewReports,
    });
  } catch (error) {
    if (error instanceof TenantConnectionError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    winstonLogger.error('Error fetching overdue tickets for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
