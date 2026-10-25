import sinon from 'sinon';
import db from '../setup/db';
import config from '../../src/app/config/app';
import * as saasMiddleware from '../../src/app/middleware/saasMiddlewareV2';
import * as connections from '../../src/app/database/connections';
import TenantBuilder from './builders/tenantBuilder';

describe('saas middleware', () => {
  const originalConfig = {};
  let tenantDBConnectionStub;

  beforeEach(() => {
    originalConfig.environment = config.environment;
    originalConfig.connectTenantOrigin = config.connectTenantOrigin;
    config.environment = 'test';
    config.connectTenantOrigin = '';

    sinon.stub(connections, 'tenantsDBConnection').resolves(db.tenantsConnection);
    tenantDBConnectionStub = sinon.stub(connections, 'tenantDBConnection').resolves(db.dbConnection);
  });

  afterEach(() => {
    config.environment = originalConfig.environment;
    config.connectTenantOrigin = originalConfig.connectTenantOrigin;
    connections.tenantsDBConnection.restore();
    tenantDBConnectionStub.restore();
  });

  it.each(['Free', 'Advanced', 'Ultra', 'Enterprise'])(
    'connects %s tenants to publicdb',
    async (plan) => {
      const origin = `https://${plan.toLowerCase()}.example.com`;
      const tenant = await new TenantBuilder()
        .withOrigin(origin)
        .withPlan(plan)
        .withOwner(db.defaultUser._id)
        .save();
      const req = { headers: { origin }, get: () => origin };
      const res = { sendStatus: sinon.stub() };
      const next = sinon.stub();

      // jest-setup stubs saas for every test, so call the original implementation directly
      await saasMiddleware.saas.wrappedMethod(req, res, next);

      expect(res.sendStatus.called).toBe(false);
      expect(next.calledOnce).toBe(true);
      expect(tenantDBConnectionStub.calledOnceWithExactly('publicdb')).toBe(true);
      expect(req.dbName).toEqual('publicdb');
      expect(req.tenantId).toEqual(tenant.id);
    },
  );
});
