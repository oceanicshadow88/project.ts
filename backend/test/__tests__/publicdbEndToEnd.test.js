import request from 'supertest';
import app from '../setup/app';
import db from '../setup/db';
import config from '../../src/app/config/app';
import * as saasMiddleware from '../../src/app/middleware/saasMiddlewareV2';
import * as authMiddleware from '../../src/app/middleware/authMiddleware';
import { dataConnectionPool, tenantConnection } from '../../src/app/utils/dbContext';
import { PUBLIC_DB } from '../../src/app/database/connections';
import * as Project from '../../src/app/model/project';
import * as ReviewReportService from '../../src/app/services/reviewReportService';
import TenantBuilder from './builders/tenantBuilder';
import UserBuilder from './builders/userBuilder';
import ProjectBuilder from './builders/projectBuilder';
import TicketBuilder from './builders/ticketBuilder';
import ReviewReportBuilder from './builders/reviewReportBuilder';

const PASSWORD = 'secret123';

// Runs requests through the real saas and auth middleware. Only publicdb and the tenants
// database are cached, and PUBLIC_CONNECTION is empty in tests, so any attempt to open a
// separate database for a company fails the request.
describe('single publicdb end to end', () => {
  const originalConfig = {};

  beforeAll(() => {
    const realSaas = saasMiddleware.saas.wrappedMethod;
    saasMiddleware.saas.callsFake((req, res, next) =>
      realSaas(req, res, (err) => {
        // Jest loads Node's domain module, which makes every event on req call req.domain.enter(),
        // so the origin string saas stores in req.domain crashes the request under test only.
        delete req.domain;
        next(err);
      }),
    );
    authMiddleware.authenticationTokenMiddleware.callsFake(
      authMiddleware.authenticationTokenMiddleware.wrappedMethod,
    );
  });

  beforeEach(() => {
    originalConfig.environment = config.environment;
    originalConfig.connectTenantOrigin = config.connectTenantOrigin;
    originalConfig.accessSecret = config.accessSecret;
    config.environment = 'test';
    config.connectTenantOrigin = '';
    config.accessSecret = 'end-to-end-secret';

    Object.keys(dataConnectionPool).forEach((key) => delete dataConnectionPool[key]);
    dataConnectionPool[PUBLIC_DB] = db.dbConnection;
    tenantConnection.connection = db.tenantsConnection;
  });

  afterEach(() => {
    config.environment = originalConfig.environment;
    config.connectTenantOrigin = originalConfig.connectTenantOrigin;
    config.accessSecret = originalConfig.accessSecret;
  });

  const createCompany = async (name, plan) => {
    const origin = `https://${name}.example.com`;
    const owner = await new UserBuilder()
      .withName(`${name} owner`)
      .withEmail(`owner-${name}@example.com`)
      .withPassword(PASSWORD)
      .save();
    const tenant = await new TenantBuilder()
      .withOrigin(origin)
      .withPlan(plan)
      .withOwner(owner._id)
      .withActive(true)
      .save();
    owner.tenants = [tenant._id];
    await owner.save();

    const res = await request(app.application)
      .post('/api/v2/login')
      .set('Origin', origin)
      .send({ email: owner.email, password: PASSWORD })
      .expect(200);

    return { origin, owner, tenant, token: res.body.token };
  };

  const asCompany = (company) => ({
    get: (url) => request(app.application).get(url).set('Origin', company.origin).set('Authorization', `Bearer ${company.token}`),
    post: (url) => request(app.application).post(url).set('Origin', company.origin).set('Authorization', `Bearer ${company.token}`),
    put: (url) => request(app.application).put(url).set('Origin', company.origin).set('Authorization', `Bearer ${company.token}`),
    delete: (url) => request(app.application).delete(url).set('Origin', company.origin).set('Authorization', `Bearer ${company.token}`),
  });

  const createProject = async (company, name, key) => {
    const res = await asCompany(company)
      .post('/api/v2/projects')
      .send({ name, key, projectLead: company.owner.id, userId: company.owner.id })
      .expect(201);
    return res.body;
  };

  it('serves Free and paid companies from publicdb only', async () => {
    const free = await createCompany('freeco', 'Free');
    const paid = await createCompany('paidco', 'Advanced');

    await asCompany(free).get('/api/v2/projects').expect(200);
    await asCompany(paid).get('/api/v2/projects').expect(200);

    expect(Object.keys(dataConnectionPool)).toEqual([PUBLIC_DB]);
  });

  it('stores both companies projects in publicdb, each tagged with its own tenant', async () => {
    const free = await createCompany('freeco', 'Free');
    const paid = await createCompany('paidco', 'Enterprise');

    const freeProject = await createProject(free, 'Free Website', 'FRE');
    const paidProject = await createProject(paid, 'Paid Secret Plans', 'PAI');

    const stored = await Project.getModel(db.dbConnection).find({
      _id: { $in: [freeProject.id, paidProject.id] },
    });
    const tenantById = Object.fromEntries(stored.map((p) => [p.id, p.tenant.toString()]));

    expect(tenantById[freeProject.id]).toEqual(free.tenant.id);
    expect(tenantById[paidProject.id]).toEqual(paid.tenant.id);
  });

  it('lists only the requesting company projects', async () => {
    const free = await createCompany('freeco', 'Free');
    const paid = await createCompany('paidco', 'Ultra');

    const freeProject = await createProject(free, 'Free Website', 'FRE');
    const paidProject = await createProject(paid, 'Paid Secret Plans', 'PAI');

    const freeList = await asCompany(free).get('/api/v2/projects').expect(200);
    const paidList = await asCompany(paid).get('/api/v2/projects').expect(200);

    expect(freeList.body.map((p) => p.id)).toEqual([freeProject.id]);
    expect(paidList.body.map((p) => p.id)).toEqual([paidProject.id]);
  });

  it('stops a company viewing, loading, updating or deleting another company project', async () => {
    const free = await createCompany('freeco', 'Free');
    const paid = await createCompany('paidco', 'Advanced');
    const paidProject = await createProject(paid, 'Paid Secret Plans', 'PAI');

    const show = await asCompany(free).get(`/api/v2/projects/${paidProject.id}`);
    expect(show.body.id).toBeUndefined();

    await asCompany(free).get(`/api/v2/projects/${paidProject.id}/details`).expect(500);

    await asCompany(free)
      .put(`/api/v2/projects/${paidProject.id}`)
      .send({ name: 'hacked' })
      .expect(500);

    await asCompany(free).delete(`/api/v2/projects/${paidProject.id}`).expect(200);

    const stillThere = await asCompany(paid).get(`/api/v2/projects/${paidProject.id}`).expect(200);
    expect(stillThere.body.name).toEqual('Paid Secret Plans');
    expect(stillThere.body.isDelete).toBe(false);
  });

  it('rejects requests from an origin that is not a registered company', async () => {
    const free = await createCompany('freeco', 'Free');

    await request(app.application)
      .get('/api/v2/projects')
      .set('Origin', 'https://unknown.example.com')
      .set('Authorization', `Bearer ${free.token}`)
      .expect(500);
  });

  it('reads a paid company review reports from publicdb', async () => {
    const paid = await createCompany('paidco', 'Advanced');
    const project = await new ProjectBuilder().withTenant(paid.tenant._id).save();
    const ticket = await new TicketBuilder().withProject(project).save();
    const report = await new ReviewReportBuilder()
      .withTicket(ticket)
      .withProject(project)
      .withAssignee(paid.owner._id)
      .withStatus('pending')
      .save();

    const pending = await ReviewReportService.getPendingReviewReports(paid.owner.id, paid.tenant.id);

    expect(pending.map((r) => r._id.toString())).toEqual([report._id.toString()]);
    expect(Object.keys(dataConnectionPool)).toEqual([PUBLIC_DB]);
  });
});
