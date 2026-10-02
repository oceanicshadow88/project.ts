import request from 'supertest';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import app from '../setup/app';
import db from '../setup/db';
import LabelBuilder from './builders/labelBuilder';
import ProjectBuilder from './builders/projectBuilder';
import TicketBuilder from './builders/ticketBuilder';
import PermissionBuilder from './builders/permissionBuilder';
import * as Label from '../../src/app/model/label';
import * as Role from '../../src/app/model/role';
import * as permissionMiddleware from '../../src/app/middleware/permissionMiddleware';

const countLabels = (filter = {}) => Label.getModel(db.dbConnection).countDocuments(filter);

describe('Label Test', () => {
  describe('POST /projects/:projectId/labels', () => {
    it('should create a label with name and color for the project', async () => {
      const project = await new ProjectBuilder().save();

      const res = await request(app.application)
        .post(`/api/v2/projects/${project.id}/labels`)
        .send({ name: '  Bug Fix  ', color: '#e53935' });

      expect(res.statusCode).toEqual(httpStatus.CREATED);
      expect(res.body).toMatchObject({
        name: 'Bug Fix',
        slug: 'bug-fix',
        color: '#e53935',
        projectId: project.id,
      });
      expect(await countLabels({ projectId: project._id })).toEqual(1);
    });

    it('should use the default color when no color is sent', async () => {
      const project = await new ProjectBuilder().save();

      const res = await request(app.application)
        .post(`/api/v2/projects/${project.id}/labels`)
        .send({ name: 'QA' });

      expect(res.statusCode).toEqual(httpStatus.CREATED);
      expect(res.body.color).toEqual('#6a2add');
    });

    it('should return 409 for a duplicate name in the same project, ignoring case', async () => {
      const project = await new ProjectBuilder().save();
      await new LabelBuilder().withName('Bug').withSlug('bug').withProjectId(project._id).save();

      const res = await request(app.application)
        .post(`/api/v2/projects/${project.id}/labels`)
        .send({ name: ' BUG ' });

      expect(res.statusCode).toEqual(httpStatus.CONFLICT);
      expect(res.body.message).toEqual('Label already exists');
      expect(await countLabels()).toEqual(1);
    });

    it('should allow the same name in another project', async () => {
      const projectA = await new ProjectBuilder().save();
      const projectB = await new ProjectBuilder().withKey('PRB').save();
      await new LabelBuilder().withName('Bug').withSlug('bug').withProjectId(projectA._id).save();

      const res = await request(app.application)
        .post(`/api/v2/projects/${projectB.id}/labels`)
        .send({ name: 'Bug' });

      expect(res.statusCode).toEqual(httpStatus.CREATED);
      expect(await countLabels()).toEqual(2);
    });

    it.each([
      ['an empty name', { name: '' }],
      ['a name with only spaces', { name: '   ' }],
      ['a name longer than 30 characters', { name: 'a'.repeat(31) }],
      ['an invalid color', { name: 'QA', color: 'red' }],
    ])('should return 422 for %s', async (_, body) => {
      const project = await new ProjectBuilder().save();

      const res = await request(app.application)
        .post(`/api/v2/projects/${project.id}/labels`)
        .send(body);

      expect(res.statusCode).toEqual(httpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body.message).toBeDefined();
      expect(await countLabels()).toEqual(0);
    });
  });

  describe('GET /projects/:projectId/labels', () => {
    it('should return labels of the project and labels without a project only', async () => {
      const projectA = await new ProjectBuilder().save();
      const projectB = await new ProjectBuilder().withKey('PRB').save();
      await new LabelBuilder().withName('A Label').withSlug('a-label').withProjectId(projectA._id).save();
      await new LabelBuilder().withName('B Label').withSlug('b-label').withProjectId(projectB._id).save();
      await new LabelBuilder().withName('Legacy').withSlug('legacy').save();

      const res = await request(app.application).get(`/api/v2/projects/${projectA.id}/labels`);

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body.map((label) => label.name).sort()).toEqual(['A Label', 'Legacy']);
    });
  });

  describe('POST /tickets/:ticketId/labels', () => {
    it('should save the ticket project on a label created from a ticket', async () => {
      const project = await new ProjectBuilder().save();
      const ticket = await new TicketBuilder().withProject(project).save();

      const res = await request(app.application)
        .post(`/api/v2/tickets/${ticket.id}/labels`)
        .send({ name: 'From Ticket', slug: 'from-ticket' });

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body.projectId).toEqual(project.id);
    });
  });
});

describe('Permission middleware for edit:settings', () => {
  // jest-setup.js stubs permissionMiddleware.permission for every route,
  // so the real implementation is reached through the stub's wrappedMethod.
  const checkEditSettings = (req, res, next) =>
    permissionMiddleware.permission.wrappedMethod('edit:settings')(req, res, next);

  const run = async (user, project) => {
    const req = { user, params: { projectId: project.id }, dbConnection: db.dbConnection };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() };
    const next = jest.fn();
    await checkEditSettings(req, res, next);
    return { res, next };
  };

  const createRole = async (permissionSlugs) => {
    const permissions = await Promise.all(
      permissionSlugs.map((slug) =>
        new PermissionBuilder().withSlug(slug).withDescription(slug).save(),
      ),
    );
    return Role.getModel(db.dbConnection).create({
      name: 'Test Role',
      slug: 'test-role',
      permissions: permissions.map((permission) => permission._id),
    });
  };

  const member = (project, role) => ({
    id: new mongoose.Types.ObjectId().toString(),
    isSuperUser: 0,
    projectsRoles: role ? [{ project: project._id, role: role._id }] : [],
  });

  it('should call next for a member whose role has edit:settings', async () => {
    const project = await new ProjectBuilder().save();
    const role = await createRole(['edit:settings']);

    const { res, next } = await run(member(project, role), project);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 403 and stop for a member without edit:settings', async () => {
    const project = await new ProjectBuilder().save();
    const role = await createRole(['add:tickets']);

    const { res, next } = await run(member(project, role), project);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 for a user with no role in the project', async () => {
    const project = await new ProjectBuilder().save();

    const { res, next } = await run(member(project, null), project);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next for the project owner without the permission', async () => {
    const project = await new ProjectBuilder().save(); // owner is db.defaultUser
    const owner = { id: db.defaultUser._id.toString(), isSuperUser: 0, projectsRoles: [] };

    const { next } = await run(owner, project);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should call next for a super user', async () => {
    const project = await new ProjectBuilder().save();

    const { next } = await run({ ...member(project, null), isSuperUser: 1 }, project);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
