# Overdue Ticket Management System

This system automatically detects overdue tickets and enforces review report submissions with automatic access removal.

## Files Created/Modified

### Backend Models
- **`/src/app/model/reviewReport.ts`** - New model for tracking review reports

### Backend Services
- **`/src/app/services/overdueTicketService.ts`** - Core service for overdue ticket detection and processing

### Backend Controllers
- **`/src/app/controllers/v1/reviewReportController.ts`** - API endpoints for review report management

### Backend Routes
- **`/src/app/routes/reviewReportRoutes.ts`** - Route definitions for review report endpoints

### Console Scripts
- **`/src/app/console/checkOverdueTickets.ts`** - Scheduled job script for automated overdue checking

## How It Works

### 1. Overdue Detection
The system checks for tickets that are overdue based on:
- **Ticket due date (`dueAt`)**: If ticket has a due date and it's past that date
- **Sprint end date**: If ticket doesn't have a due date (or due date is in future) but sprint has ended

### 2. Automated Process Flow

#### Initial Detection
1. **Scheduled job runs daily** (recommended: 9 AM via cron)
2. **Finds overdue tickets** across all tenants
3. **Creates review report record** with 1-week deadline
4. **Sends email notification** to assignee requesting review report

#### Follow-up Actions
1. **Daily checks** for pending review reports
2. **Warning email** sent when report deadline is reached
3. **24-hour grace period** after warning email
4. **Automatic access removal** if no report submitted

### 3. Email Templates Needed

You need to create these AWS SES email templates:

#### `overdue-ticket-notification`
```json
{
  "TemplateName": "overdue-ticket-notification",
  "Subject": "Action Required: Submit Review Report for Overdue Ticket {{ticketNumber}}",
  "HtmlPart": "...",
  "TextPart": "..."
}
```

#### `overdue-ticket-warning`
```json
{
  "TemplateName": "overdue-ticket-warning",
  "Subject": "URGENT: Submit Review Report or Lose Project Access",
  "HtmlPart": "...",
  "TextPart": "..."
}
```

#### `project-access-removed`
```json
{
  "TemplateName": "project-access-removed",
  "Subject": "Project Access Removed Due to Unsubmitted Review Report",
  "HtmlPart": "...",
  "TextPart": "..."
}
```

## API Endpoints

### Submit Review Report
```
POST /api/v1/review-reports/submit
Authorization: Bearer <token>

Body:
{
  "ticketId": "ticket_id",
  "reportContent": "Detailed review report content..."
}
```

### Get Pending Reports (for current user)
```
GET /api/v1/review-reports/pending
Authorization: Bearer <token>
```

### Get Report by Ticket
```
GET /api/v1/review-reports/ticket/:ticketId
Authorization: Bearer <token>
```

### Admin: Get All Overdue Tickets
```
GET /api/v1/review-reports/admin?status=pending
Authorization: Bearer <token>
```

## Setup Instructions

### 1. Add Routes to Express App
Add to your main routes file (usually `/src/loaders/routes/index.ts`):

```typescript
import reviewReportRoutes from '../../app/routes/reviewReportRoutes';

// Add this line with other route registrations
app.use('/api/v1/review-reports', reviewReportRoutes);
```

### 2. Set Up Cron Job
Add to your server's crontab:

```bash
# Run overdue ticket check daily at 9 AM
0 9 * * * /usr/bin/node /path/to/your/app/dist/src/app/console/checkOverdueTickets.js >> /var/log/overdue-tickets.log 2>&1
```

Or use a process manager like PM2:

```bash
pm2 start --name "overdue-check" --cron "0 9 * * *" dist/src/app/console/checkOverdueTickets.js
```

### 3. Create Email Templates in AWS SES

Use AWS CLI or console to create the required email templates with appropriate HTML/text content.

### 4. Environment Variables
Ensure these are set in your `.env`:
- `TENANTS_CONNECTION` - MongoDB connection string for tenants
- `AWS_ACCESS_KEY_ID` - AWS access key for SES
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for SES
- `AWS_REGION` - AWS region for SES
- `MAIN_DOMAIN` - Your app's domain for email sender

## Database Schema

The `reviewReports` collection will be created automatically with these fields:

```typescript
{
  ticket: ObjectId,           // Reference to ticket
  assignee: ObjectId,         // Reference to user
  project: ObjectId,          // Reference to project
  dueDate: Date,             // When report is due (1 week from creation)
  submittedAt: Date,         // When report was submitted
  submittedBy: ObjectId,     // Who submitted the report
  reportContent: String,     // Report content
  status: String,            // 'pending', 'submitted', 'overdue'
  emailSentAt: Date,         // When initial email was sent
  warningEmailSentAt: Date,  // When warning email was sent
  accessRemovedAt: Date,     // When access was removed
  notes: String,             // Additional notes
  createdAt: Date,           // Auto timestamp
  updatedAt: Date            // Auto timestamp
}
```

## Testing

### Manual Testing
1. **Create overdue ticket**: Set dueAt to past date or assign to ended sprint
2. **Run console script**: `node dist/src/app/console/checkOverdueTickets.js`
3. **Check logs**: Verify emails sent and database records created
4. **Test API endpoints**: Use Postman/curl to test all endpoints

### Production Monitoring
- Monitor cron job logs
- Set up alerts for failed email sends
- Track review report submission rates
- Monitor database for growing overdue tickets

## Security Considerations

1. **Access Control**: Only assignees can submit their own reports
2. **Admin Endpoints**: Add role-based access control for admin endpoints
3. **Rate Limiting**: Consider rate limiting on submission endpoint
4. **Audit Trail**: All actions are logged with timestamps
5. **Data Privacy**: Review reports may contain sensitive information

## Customization Options

### Email Schedule
Modify the timing in `overdueTicketService.ts`:
- Change report deadline (currently 1 week)
- Change warning timing (currently immediate when overdue)
- Change access removal timing (currently 24 hours after warning)

### Access Removal Logic
Current implementation removes user from project roles. You can modify `removeUserProjectAccess()` to:
- Suspend user instead of removing
- Send notifications to project managers
- Create audit logs

### Notification Recipients
Add project managers, team leads, or admins to notification emails by modifying the email template data.

This system provides a complete automated solution for managing overdue tickets and enforcing accountability through review reports.
