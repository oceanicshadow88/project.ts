import sinon from 'sinon';
import { QuestionJob } from '../../src/app/jobs/questionJob';
import { OverdueTicketService } from '../../src/app/services/overdueTicketService';
import * as connections from '../../src/app/database/connections';
import db from '../setup/db';

describe('jobs use publicdb for all tenants', () => {
  let tenantDBConnectionStub;

  beforeEach(() => {
    tenantDBConnectionStub = sinon.stub(connections, 'tenantDBConnection').resolves(db.dbConnection);
  });

  afterEach(() => {
    tenantDBConnectionStub.restore();
  });

  it('QuestionJob connects to publicdb instead of the tenant id', async () => {
    const job = new QuestionJob({
      questionId: '000000000000000000000001',
      ticketId: '000000000000000000000002',
      tenantId: 'paid-tenant-id',
    });

    await job.handle();

    expect(tenantDBConnectionStub.calledOnceWithExactly('publicdb')).toBe(true);
  });

  it('overdue ticket processing connects to publicdb once', async () => {
    await OverdueTicketService.checkAndProcessOverdueTickets();

    expect(tenantDBConnectionStub.calledOnceWithExactly('publicdb')).toBe(true);
  });
});
