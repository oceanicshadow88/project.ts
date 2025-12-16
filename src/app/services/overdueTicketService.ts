/* eslint-disable no-console */
import mongoose from 'mongoose';
import config from '../config/app';
import { dataConnectionPool } from '../utils/dbContext';
import * as Ticket from '../model/ticket';
import * as Project from '../model/project';
import * as User from '../model/user';
import * as ReviewReport from '../model/reviewReport';
import { winstonLogger } from '../../loaders/logger';

interface BrokenTicketSample {
  ticketId: string;
  ticketTitle?: string;
  projectName?: string;
  assigneeName?: string;
  dueDate?: Date;
  reason: string;
}

/**
 * Service for handling overdue ticket detection and processing
 */
export class OverdueTicketService {
  /**
   * Main method to check and process overdue tickets across all tenants
   */
  static async checkAndProcessOverdueTickets(): Promise<void> {
    console.log('=== Starting overdue ticket processing ===');
    
    // Get all tenant databases
    const tenantDatabases = await this.getTenantDatabases();
    console.log(`Found ${tenantDatabases.length} tenant database(s) to process`);

    let totalOverdueTickets = 0;
    let totalBrokenTickets = 0;
    let totalCleanedTickets = 0;

    for (const tenantDb of tenantDatabases) {
      try {
        console.log(`\n--- Processing tenant: ${tenantDb} ---`);
        
        // Connect to tenant database
        let connection = dataConnectionPool[tenantDb];
        
        // If no cached connection, create a new one
        if (!connection) {
          connection = mongoose.createConnection(`${config.tenantsDBConnection.split('/').slice(0, -1).join('/')}/${tenantDb}`);
          dataConnectionPool[tenantDb] = connection;
        }
        
        // Get all models for this tenant
        const TicketModel = Ticket.getModel(connection);
        const ProjectModel = Project.getModel(connection);
        const UserModel = User.getModel(connection);
        const ReviewReportModel = ReviewReport.getModel(connection);

        // Clean up broken ticket references first
        const cleanupResult = await this.cleanupBrokenTicketReferences(TicketModel);
        totalCleanedTickets += cleanupResult.cleanedCount;
        totalBrokenTickets += cleanupResult.brokenCount;

        // Process overdue tickets for this tenant
        const overdueCount = await this.processOverdueTicketsForTenant(
          TicketModel,
          ProjectModel, 
          UserModel,
          ReviewReportModel,
          tenantDb,
        );
        totalOverdueTickets += overdueCount;

        console.log(`Tenant ${tenantDb}: ${overdueCount} overdue tickets processed`);
        
      } catch (error) {
        console.error(`Error processing tenant ${tenantDb}:`, error);
        winstonLogger.error(`Error processing tenant ${tenantDb}:`, error);
      }
    }

    console.log('\n=== Processing Summary ===');
    console.log(`Total broken tickets found: ${totalBrokenTickets}`);
    console.log(`Total broken tickets cleaned: ${totalCleanedTickets}`);
    console.log(`Total overdue tickets processed: ${totalOverdueTickets}`);
    console.log('=== Overdue ticket processing completed ===');
  }

  /**
   * Clean up tickets with broken assignee or project references
   */
  private static async cleanupBrokenTicketReferences(
    TicketModel: any,
  ): Promise<{ cleanedCount: number; brokenCount: number }> {
    const brokenTicketSamples: BrokenTicketSample[] = [];
    let cleanedCount = 0;
    let brokenCount = 0;

    try {
      // Find tickets with assigned users
      const ticketsWithAssignees = await TicketModel.find({
        assign: { $ne: null },
      }).populate('assign', 'name email').populate('project', 'name');

      console.log(`Checking ${ticketsWithAssignees.length} tickets with assignees for broken references...`);

      for (const ticket of ticketsWithAssignees) {
        let hasBrokenReference = false;
        let brokenReason = '';

        // Check if assignee exists and is populated
        if (!ticket.assign?._id) {
          hasBrokenReference = true;
          brokenReason = 'Assignee reference broken (user deleted)';
          
          // Clean up: set assign to null
          await TicketModel.findByIdAndUpdate(ticket._id, { assign: null });
          cleanedCount++;
        }

        // Check if project exists and is populated
        if (!ticket.project?._id) {
          hasBrokenReference = true;
          brokenReason += (brokenReason ? ' and ' : '') + 'Project reference broken (project deleted)';
        }

        if (hasBrokenReference) {
          brokenCount++;
          
          // Sample first 5 broken tickets for reporting
          if (brokenTicketSamples.length < 5) {
            brokenTicketSamples.push({
              ticketId: ticket._id.toString(),
              ticketTitle: ticket.title,
              projectName: ticket.project?.name || 'Unknown Project',
              assigneeName: ticket.assign?.name || 'Unknown User',
              dueDate: ticket.dueDate,
              reason: brokenReason,
            });
          }
        }
      }

      if (brokenCount > 0) {
        console.log('\n🔍 Data Integrity Report:');
        console.log(`Found ${brokenCount} tickets with broken references`);
        console.log(`Cleaned ${cleanedCount} tickets (set assign to null for broken user references)`);
        
        if (brokenTicketSamples.length > 0) {
          console.log('\nSample broken tickets:');
          brokenTicketSamples.forEach((sample, index) => {
            console.log(`${index + 1}. Ticket: ${sample.ticketTitle} (ID: ${sample.ticketId})`);
            console.log(`   Project: ${sample.projectName}`);
            console.log(`   Assignee: ${sample.assigneeName}`);
            console.log(`   Due Date: ${sample.dueDate || 'Not set'}`);
            console.log(`   Issue: ${sample.reason}`);
          });
        }

        winstonLogger.warn('Data integrity issues found', {
          brokenTicketsCount: brokenCount,
          cleanedTicketsCount: cleanedCount,
          sampleBrokenTickets: brokenTicketSamples,
        });
      }

    } catch (error) {
      console.error('Error during cleanup of broken ticket references:', error);
      winstonLogger.error('Error during cleanup of broken ticket references:', error);
    }

    return { cleanedCount, brokenCount };
  }

  /**
   * Process overdue tickets for a specific tenant
   */
  private static async processOverdueTicketsForTenant(
    TicketModel: any,
    ProjectModel: any,
    UserModel: any,
    ReviewReportModel: any,
    tenantId: string,
  ): Promise<number> {
    const now = new Date();
    
    try {
      // Find overdue tickets with valid assignees and projects
      const overdueTickets = await TicketModel.find({
        dueAt: { $lt: now },
        assign: { $ne: null }, // Only tickets with assigned users
        project: { $ne: null }, // Only tickets with valid projects
      })
        .populate('assign', 'name email')
        .populate('project', 'name');

      console.log(`Found ${overdueTickets.length} overdue tickets with valid references`);

      if (overdueTickets.length === 0) {
        return 0;
      }

      let processedCount = 0;

      for (const ticket of overdueTickets) {
        try {
          // Skip tickets with broken references (safety check)
          if (!ticket.assign?._id || !ticket.project?._id) {
            console.log(`Skipping ticket ${ticket._id} - broken references detected`);
            continue;
          }

          // Check if review report already exists
          const existingReport = await ReviewReportModel.findOne({ ticketId: ticket._id });
          
          if (existingReport) {
            console.log(`Review report already exists for ticket ${ticket._id}, skipping...`);
            continue;
          }

          // Create review report
          await this.createReviewReport(ticket, ReviewReportModel);

          // Send notification email
          await this.sendOverdueTicketNotification(ticket);

          // Remove user access if needed (optional - implement based on requirements)
          // await this.removeUserAccess(ticket.assign._id, ticket.projectId._id);

          processedCount++;
          console.log(`Processed overdue ticket: ${ticket.title} (ID: ${ticket._id})`);

        } catch (error) {
          console.error(`Error processing individual ticket ${ticket._id}:`, error);
          winstonLogger.error(`Error processing individual ticket ${ticket._id}:`, error);
        }
      }

      return processedCount;

    } catch (error) {
      console.error(`Error processing overdue tickets for tenant ${tenantId}:`, error);
      winstonLogger.error(`Error processing overdue tickets for tenant ${tenantId}:`, error);
      return 0;
    }
  }

  /**
   * Create a review report for an overdue ticket
   */
  private static async createReviewReport(ticket: any, ReviewReportModel: any): Promise<void> {
    try {
      const daysPastDue = Math.floor((Date.now() - new Date(ticket.dueAt).getTime()) / (1000 * 60 * 60 * 24));
      
      const reportContent = `
        Ticket is ${daysPastDue} day(s) overdue.
        
        Ticket Details:
        - Title: ${ticket.title}
        - Assigned to: ${ticket.assign.name} (${ticket.assign.email})
        - Project: ${ticket.project.name}
        - Due Date: ${ticket.dueAt.toDateString()}
        - Current Status: ${ticket.status}
        
        Please review and provide an update on the progress.
      `.trim();

      await ReviewReportModel.create({
        ticketId: ticket._id,
        assigneeId: ticket.assign._id,
        reportContent,
        status: 'pending',
        createdAt: new Date(),
      });

    } catch (error) {
      console.error(`Error creating review report for ticket ${ticket._id}:`, error);
      throw error;
    }
  }

  /**
   * Send notification email for overdue ticket
   */
  private static async sendOverdueTicketNotification(ticket: any): Promise<void> {
    try {
      console.log(`Sending overdue notification for ticket ${ticket._id} to ${ticket.assign.email}`);
      // Note: Email functionality would be implemented here
      // For now, just log the notification
      const daysPastDue = Math.floor((Date.now() - new Date(ticket.dueAt).getTime()) / (1000 * 60 * 60 * 24));
      console.log(`Email notification would be sent: Ticket "${ticket.title}" is ${daysPastDue} day(s) overdue`);

    } catch (error) {
      console.error(`Error sending overdue notification for ticket ${ticket._id}:`, error);
      // Don't throw here - continue processing other tickets even if email fails
    }
  }

  /**
   * Submit a review report (called from controller)
   */
  static async submitReviewReport(
    ticketId: string,
    userId: string,
    reportContent: string,
    tenantId: string,
  ): Promise<void> {
    try {
      let connection = dataConnectionPool[tenantId];
      
      if (!connection) {
        connection = mongoose.createConnection(`${config.tenantsDBConnection.split('/').slice(0, -1).join('/')}/${tenantId}`);
        dataConnectionPool[tenantId] = connection;
      }
      
      const ReviewReportModel = ReviewReport.getModel(connection);

      await ReviewReportModel.findOneAndUpdate(
        { ticketId, assigneeId: userId },
        { 
          reportContent,
          status: 'submitted',
          submittedAt: new Date(),
        },
        { new: true, upsert: true },
      );

      console.log(`Review report submitted for ticket ${ticketId} by user ${userId}`);

    } catch (error) {
      console.error('Error submitting review report:', error);
      winstonLogger.error('Error submitting review report:', error);
      throw error;
    }
  }

  /**
   * Get list of all tenant databases
   */
  private static async getTenantDatabases(): Promise<string[]> {
    try {
      // Get list of databases from MongoDB admin
      const admin = mongoose.connection.db.admin();
      const result = await admin.listDatabases();
      
      // Filter to get only tenant databases (exclude system databases)
      const databases = result.databases
        .map((db: any) => db.name)
        .filter((db: string) => 
          db !== 'tenants' && 
          !db.startsWith('local') && 
          !db.startsWith('admin') && 
          !db.startsWith('config'),
        );
      
      return databases;
    } catch (error) {
      console.error('Error getting tenant databases:', error);
      winstonLogger.error('Error getting tenant databases:', error);
      return [];
    }
  }
}
