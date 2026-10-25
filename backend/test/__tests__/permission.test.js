import request from 'supertest';
import httpStatus from 'http-status';
import app from '../setup/app';
import PermissionBuilder from './builders/permissionBuilder';

describe('Permission Test', () => {
  it('should get all permissions', async () => {
    const permission1 = await new PermissionBuilder()
      .withSlug('view:projects')
      .withDescription('View Projects')
      .save();
    const permission2 = await new PermissionBuilder()
      .withSlug('edit:projects')
      .withDescription('Edit Projects')
      .save();

    const res = await request(app.application)
      .get('/api/v2/permissions')
      .expect(httpStatus.OK);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);

    const bySlug = Object.fromEntries(res.body.map((permission) => [permission.slug, permission]));

    expect(bySlug['view:projects'].id).toEqual(permission1._id.toString());
    expect(bySlug['view:projects'].description).toEqual('View Projects');
    expect(bySlug['edit:projects'].id).toEqual(permission2._id.toString());
    expect(bySlug['edit:projects'].description).toEqual('Edit Projects');
  });

  it('should return an empty array when there are no permissions', async () => {
    const res = await request(app.application)
      .get('/api/v2/permissions')
      .expect(httpStatus.OK);

    expect(res.body).toEqual([]);
  });
});
