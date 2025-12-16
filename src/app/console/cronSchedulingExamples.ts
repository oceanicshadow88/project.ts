/* eslint-disable @typescript-eslint/no-unused-vars, no-console */

// Example cron job setup for the overdue ticket check
// This file demonstrates how to set up the overdue ticket check
// as a scheduled job using popular Node.js cron libraries.

// Usage examples:
// 1. Using node-cron: npm install node-cron
// 2. Using cron: npm install cron  
// 3. Using node-schedule: npm install node-schedule

// Example 1: Using node-cron
function setupWithNodeCron() {
  const cron = require('node-cron');
  const { runOverdueTicketCheck } = require('./checkOverdueTickets');
  
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Starting scheduled overdue ticket check...');
    await runOverdueTicketCheck();
  });
}

// Example 2: Using cron library
function setupWithCronJob() {
  const { CronJob } = require('cron');
  const { runOverdueTicketCheck } = require('./checkOverdueTickets');
  
  const job = new CronJob(
    '0 9 * * *', // Run at 9:00 AM every day
    runOverdueTicketCheck,
    null,
    true, // Start immediately
    'America/New_York', // Timezone
  );
  
  return job;
}

// Example 3: Using node-schedule
function setupWithNodeSchedule() {
  const schedule = require('node-schedule');
  const { runOverdueTicketCheck } = require('./checkOverdueTickets');
  
  // Run every day at 9:00 AM
  const rule = new schedule.RecurrenceRule();
  rule.hour = 9;
  rule.minute = 0;
  
  const job = schedule.scheduleJob(rule, runOverdueTicketCheck);
  return job;
}

// Example 4: Simple interval (for testing)
function setupWithInterval() {
  const { runOverdueTicketCheck } = require('./checkOverdueTickets');
  
  // Run every hour (for testing purposes)
  return setInterval(async () => {
    console.log('Running overdue ticket check...');
    await runOverdueTicketCheck();
  }, 60 * 60 * 1000); // 1 hour
}

// Example 5: Manual execution for testing
async function runManually() {
  const { runOverdueTicketCheck } = require('./checkOverdueTickets');
  
  try {
    await runOverdueTicketCheck();
  } catch (error) {
    console.error('Error running overdue ticket check:', error);
  }
}

// Recommended cron schedule patterns for overdue ticket checks:
const CRON_PATTERNS = {
  daily: '0 9 * * *',        // Daily at 9:00 AM
  businessDays: '0 9 * * 1-5',      // Monday to Friday at 9:00 AM
  twiceDaily: '0 9,17 * * 1-5',   // Twice daily at 9:00 AM and 5:00 PM on business days
  hourly: '0 * * * *',        // Every hour (for testing)
  halfHourly: '0,30 9-17 * * 1-5', // Every 30 minutes during business hours on weekdays
};

export { 
  setupWithNodeCron, 
  setupWithCronJob, 
  setupWithNodeSchedule, 
  setupWithInterval, 
  runManually, 
  CRON_PATTERNS,
};
