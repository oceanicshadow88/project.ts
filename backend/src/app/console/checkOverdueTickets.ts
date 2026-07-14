/* eslint-disable no-console */

import mongoose from 'mongoose';
import config from '../config/app';
import { OverdueTicketService } from '../services/overdueTicketService';
import { winstonLogger } from '../../bootstrap/logger';
mongoose.set('strictQuery', true);
/**
 * Scheduled job to check for overdue tickets and process them
 * This should be run daily via cron job (e.g., at 9:00 AM every day)
 * 
 * Cron schedule example: 0 9 * * * (runs at 9 AM every day)
 * 
 * Usage: node dist/src/app/console/checkOverdueTickets.js
 */

async function runOverdueTicketCheck() {
  try {
    console.log('=== Starting Overdue Ticket Check Job ===');
    console.log(`Started at: ${new Date().toISOString()}`);
    
    // Connect to the tenants database
    await mongoose.connect(config.tenantsDBConnection);
    console.log('Connected to database');

    // Run the overdue ticket service
    await OverdueTicketService.checkAndProcessOverdueTickets();

    console.log('=== Overdue Ticket Check Job Completed Successfully ===');
    console.log(`Completed at: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('=== Overdue Ticket Check Job Failed ===');
    console.error('Error:', error);
    winstonLogger.error('Overdue ticket check job failed:', error);
    process.exit(1);
  } finally {
    // Close database connections
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  runOverdueTicketCheck().catch(console.error);
}

export { runOverdueTicketCheck };
