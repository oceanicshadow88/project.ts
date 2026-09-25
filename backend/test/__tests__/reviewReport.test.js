import * as ReviewReportService from '../../src/app/services/reviewReportService';
import { TenantConnectionError } from '../../src/app/services/reviewReportService';
import NotFoundError from '../../src/app/error/notFound';
import { dataConnectionPool } from '../../src/app/utils/dbContext';
import db from '../setup/db';
import ReviewReportBuilder from './builders/reviewReportBuilder';
import TicketBuilder from './builders/ticketBuilder';

let tenantId;

beforeEach(() => {
  tenantId = db.defaultTenant._id.toString();
  dataConnectionPool[tenantId] = db.dbConnection;
});

describe('getPendingReviewReports', () => {
  it('returns only pending reports assigned to the given user, sorted by due date', async () => {
    const ticketA = await new TicketBuilder().save();
    const ticketB = await new TicketBuilder().save();

    const laterReport = await new ReviewReportBuilder()
      .withTicket(ticketA)
      .withProject(ticketA.project)
      .withAssignee(db.defaultUser._id)
      .withDueDate(new Date('2026-02-01'))
      .withStatus('pending')
      .save();
    const soonerReport = await new ReviewReportBuilder()
      .withTicket(ticketB)
      .withProject(ticketB.project)
      .withAssignee(db.defaultUser._id)
      .withDueDate(new Date('2026-01-01'))
      .withStatus('pending')
      .save();
    // Already submitted: should be excluded from the pending list.
    await new ReviewReportBuilder()
      .withTicket(ticketA)
      .withProject(ticketA.project)
      .withAssignee(db.defaultUser._id)
      .withDueDate(new Date('2026-03-01'))
      .withStatus('submitted')
      .save();

    const result = await ReviewReportService.getPendingReviewReports(
      db.defaultUser._id.toString(),
      tenantId,
    );

    expect(result).toHaveLength(2);
    expect(result[0]._id.toString()).toEqual(soonerReport._id.toString());
    expect(result[1]._id.toString()).toEqual(laterReport._id.toString());
    expect(result.every((report) => report.status === 'pending')).toBe(true);
    expect(result[0].ticket.title).toEqual(ticketB.title);
    expect(result[0].project.key).toBeDefined();
  });

  it('returns an empty list when the user has no pending reports', async () => {
    const result = await ReviewReportService.getPendingReviewReports(
      db.defaultUser._id.toString(),
      tenantId,
    );
    expect(result).toEqual([]);
  });

  it('throws TenantConnectionError when no connection is cached for the tenant', async () => {
    await expect(
      ReviewReportService.getPendingReviewReports(db.defaultUser._id.toString(), 'unknown-tenant'),
    ).rejects.toBeInstanceOf(TenantConnectionError);
  });
});

describe('getReviewReportByTicket', () => {
  it('returns the review report for the given ticket and user', async () => {
    const ticket = await new TicketBuilder().save();
    const report = await new ReviewReportBuilder()
      .withTicket(ticket)
      .withProject(ticket.project)
      .withAssignee(db.defaultUser._id)
      .save();

    const result = await ReviewReportService.getReviewReportByTicket(
      ticket.id,
      db.defaultUser._id.toString(),
      tenantId,
    );

    expect(result._id.toString()).toEqual(report._id.toString());
    expect(result.ticket.id ?? result.ticket._id.toString()).toEqual(ticket.id);
  });

  it('throws NotFoundError when no report matches the ticket/user pair', async () => {
    const ticket = await new TicketBuilder().save();

    await expect(
      ReviewReportService.getReviewReportByTicket(
        ticket.id,
        db.defaultUser._id.toString(),
        tenantId,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws TenantConnectionError when no connection is cached for the tenant', async () => {
    const ticket = await new TicketBuilder().save();
    await expect(
      ReviewReportService.getReviewReportByTicket(
        ticket.id,
        db.defaultUser._id.toString(),
        'unknown-tenant',
      ),
    ).rejects.toBeInstanceOf(TenantConnectionError);
  });
});

describe('getOverdueTicketsAdmin', () => {
  it('returns all review reports when no status filter is given', async () => {
    const ticket = await new TicketBuilder().save();
    await new ReviewReportBuilder().withTicket(ticket).withProject(ticket.project).withStatus('pending').save();
    await new ReviewReportBuilder().withTicket(ticket).withProject(ticket.project).withStatus('submitted').save();
    await new ReviewReportBuilder().withTicket(ticket).withProject(ticket.project).withStatus('overdue').save();

    const result = await ReviewReportService.getOverdueTicketsAdmin(tenantId);

    expect(result).toHaveLength(3);
  });

  it('filters by status when a valid status is given', async () => {
    const ticket = await new TicketBuilder().save();
    await new ReviewReportBuilder().withTicket(ticket).withProject(ticket.project).withStatus('pending').save();
    await new ReviewReportBuilder().withTicket(ticket).withProject(ticket.project).withStatus('submitted').save();

    const result = await ReviewReportService.getOverdueTicketsAdmin(tenantId, 'submitted');

    expect(result).toHaveLength(1);
    expect(result[0].status).toEqual('submitted');
  });

  it('ignores an unrecognised status and returns the unfiltered list', async () => {
    const ticket = await new TicketBuilder().save();
    await new ReviewReportBuilder().withTicket(ticket).withProject(ticket.project).withStatus('pending').save();

    const result = await ReviewReportService.getOverdueTicketsAdmin(tenantId, 'not-a-real-status');

    expect(result).toHaveLength(1);
  });

  it('throws TenantConnectionError when no connection is cached for the tenant', async () => {
    await expect(ReviewReportService.getOverdueTicketsAdmin('unknown-tenant')).rejects.toBeInstanceOf(
      TenantConnectionError,
    );
  });
});

describe('submitReviewReport', () => {
  it('marks the matching report as submitted with trimmed content', async () => {
    const ticket = await new TicketBuilder().save();
    const report = await new ReviewReportBuilder()
      .withTicket(ticket)
      .withProject(ticket.project)
      .withAssignee(db.defaultUser._id)
      .withStatus('pending')
      .save();

    await ReviewReportService.submitReviewReport(
      ticket.id,
      db.defaultUser._id.toString(),
      '  All good now.  ',
      tenantId,
    );

    const updated = await ReviewReportService.getReviewReportByTicket(
      ticket.id,
      db.defaultUser._id.toString(),
      tenantId,
    );

    expect(updated._id.toString()).toEqual(report._id.toString());
    expect(updated.status).toEqual('submitted');
    expect(updated.reportContent).toEqual('All good now.');
    expect(updated.submittedAt).toBeDefined();
  });
});
