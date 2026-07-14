import request from 'supertest';
import StatusBuilder from './builders/statusBuilder';
import ProjectBuilder from './builders/projectBuilder';
import app from '../setup/app';

describe('Status Test', () => {
  it('should get all statuses', async () => {
    const project = await new ProjectBuilder().save();
    const status1 = await new StatusBuilder().save();
    const status2 = await new StatusBuilder().withName('In Progress').withSlug('in-progress').save();

    const res = await request(app.application).get(`/api/v2/projects/${project.id}/statuses`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    // Check that our created statuses are in the response
    const statusIds = res.body.map((s) => s.id);
    expect(statusIds).toContain(status1._id.toString());
    expect(statusIds).toContain(status2._id.toString());
  });

  it('should get all statuses for any project (no validation on projectId)', async () => {
    // The index route doesn't validate projectId, it just uses tenantId from req
    const res = await request(app.application).get('/api/v2/projects/any-project-id/statuses');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should update status', async () => {
    const project = await new ProjectBuilder().save();
    const status = await new StatusBuilder().save();
    const updatedName = 'Updated Status';

    const res = await request(app.application)
      .put(`/api/v2/projects/${project.id}/statuses/${status._id}`)
      .send({ name: updatedName });

    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toEqual(updatedName);
  });
});
