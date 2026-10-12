import request from 'supertest';
import { ObjectId } from 'mongodb';
import ProjectBuilder from './builders/projectBuilder';
import app from '../setup/app';
import db from '../setup/db';
import * as Project from '../../src/app/model/project';

const otherTenantId = new ObjectId().toString();

describe('Project Test', () => {
  it('get projects, should get projects', async () => {
    const project = await new ProjectBuilder().save();
    const res = await request(app.application).get('/api/v2/projects').expect(200);
    expect(res.body[0].id).toEqual(project.id);
    expect(res.body[0].name).toEqual(project.name);
  });

  it('get project, should get project', async () => {
    const project = await new ProjectBuilder().save();
    const res = await request(app.application).get(`/api/v2/projects/${project.id}`).expect(200);
    expect(res.body.id).toEqual(project.id);
    expect(res.body.name).toEqual(project.name);
  });

  it('create project, should create project', async () => {
    const project = new ProjectBuilder().buildDefault();
    const res = await request(app.application)
      .post('/api/v2/projects')
      .send({ ...project });
    expect(res.body._id).toEqual(project.id);
    expect(res.body.name).toEqual(project.name);
  });

  it('update project, should update project', async () => {
    const updatedName = 'haha';
    const project = await new ProjectBuilder().save();
    expect(project.name).toEqual('project');
    const res = await request(app.application)
      .put(`/api/v2/projects/${project.id}`)
      .send({ name: updatedName });
    expect(res.body.id).toEqual(project.id);
    expect(res.body.name).toEqual(updatedName);
  });

  it('delete project, should delete project', async () => {
    const project = await new ProjectBuilder().save();
    await request(app.application).delete(`/api/v2/projects/${project.id}`).expect(200);
  });

  it('create project, should return 422 when missing name', async () => {
    const project = new ProjectBuilder(false).buildDefault();
    await request(app.application)
      .post('/api/v2/projects')
      .send({ ...project, ...{ name: null } })
      .expect(422);
  });

  it('create project, should return 422 when missing key', async () => {
    const project = new ProjectBuilder(false).buildDefault();
    await request(app.application)
      .post('/api/v2/projects')
      .send({ ...project, ...{ key: null } })
      .expect(422);
  });

  it('should get project details', async () => {
    const project = await new ProjectBuilder().save();
    const res = await request(app.application).get(`/api/v2/projects/${project.id}/details`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        labels: [],
        users: [],
        ticketTypes: [],
        sprints: [],
        statuses: [],
        boards: [],
        epics: [],
        details: expect.objectContaining({
          id: project.id,
          name: project.name,
          key: project.key,
          projectLead: project.projectLead.toString(),
          owner: project.owner.toString(),
          tenant: project.tenant.toString(),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
        retroBoards: [],
      }),
    );
  });

  describe('tenant isolation', () => {
    it('should not get a project belonging to another tenant', async () => {
      const project = await new ProjectBuilder().withTenant(otherTenantId).save();
      const res = await request(app.application).get(`/api/v2/projects/${project.id}`);
      expect(res.body.id).toBeUndefined();
    });

    it('should not get project details belonging to another tenant', async () => {
      const project = await new ProjectBuilder().withTenant(otherTenantId).save();
      await request(app.application).get(`/api/v2/projects/${project.id}/details`).expect(500);
    });

    it('should not update a project belonging to another tenant', async () => {
      const project = await new ProjectBuilder().withTenant(otherTenantId).save();
      await request(app.application)
        .put(`/api/v2/projects/${project.id}`)
        .send({ name: 'hacked' })
        .expect(500);

      const unchanged = await Project.getModel(db.dbConnection).findById(project.id);
      expect(unchanged.name).toEqual(project.name);
    });

    it('should not move a project to another tenant through update', async () => {
      const project = await new ProjectBuilder().save();
      await request(app.application)
        .put(`/api/v2/projects/${project.id}`)
        .send({ tenant: otherTenantId })
        .expect(200);

      const unchanged = await Project.getModel(db.dbConnection).findById(project.id);
      expect(unchanged.tenant).toEqual(db.defaultTenant._id.toString());
    });
  });
});
