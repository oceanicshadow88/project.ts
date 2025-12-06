import request from 'supertest';
import { SPRINT_SEED } from '../fixtures/sprint';
import { setup, restore } from '../helpers';

let application = null;
const baseURL = '/api/v2/sprints';

beforeAll(async () => {
  const { app } = await setup();
  application = app();
});

afterAll(async () => {
  await restore();
});

const sprintInfo = {
  name: 'joe sprint',
  board: '6350d443bddbe8fed0138ffd',
  projectId: '6350d443bddbe8fed0138ffe',
};

describe('POST sprint', () => {
  it('should create a sprint if the least info is provided', async () => {
    const res = await request(application).post(baseURL).send(sprintInfo);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      __v: 0,
      id: expect.any(String),
      board: '6350d443bddbe8fed0138ffd',
      createdAt: expect.any(String),
      endDate: null,
      status: 'planning',
      name: 'joe sprint',
      projectId: '6350d443bddbe8fed0138ffe',
      startDate: expect.any(String),
      ticketId: [],
      updatedAt: expect.any(String),
    });
  });

  it('should create a sprint with status active', async () => {
    const res = await request(application)
      .post(baseURL)
      .send({
        ...sprintInfo,
        status: 'active',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('active');
  });

  it('should create a sprint with status completed', async () => {
    const res = await request(application)
      .post(baseURL)
      .send({
        ...sprintInfo,
        status: 'completed',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('completed');
  });

  it('should create a sprint with extra info', async () => {
    const endDate = new Date(2022, 12, 1);

    const res = await request(application)
      .post(baseURL)
      .send({
        ...sprintInfo,
        endDate: endDate,
        description: 'a new sprint',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      __v: 0,
      id: expect.any(String),
      board: '6350d443bddbe8fed0138ffd',
      createdAt: expect.any(String),
      status: 'planning',
      endDate: endDate.toISOString(),
      name: 'joe sprint',
      description: 'a new sprint',
      projectId: '6350d443bddbe8fed0138ffe',
      startDate: expect.any(String),
      ticketId: [],
      updatedAt: expect.any(String),
    });
  });

  it.each`
    field        | value
    ${'name'}     | ${undefined}
    ${'boardId'}  | ${undefined}
    ${'projectId'} | ${undefined}
    ${'status'}   | ${'invalid-status'}
  `('shoudl return 422 if $field is $value is provided', async ({ field, value }) => {
    const res = await request(application)
      .post(baseURL)
      .send({
        ...sprintInfo,
        [field]: value,
      });
    expect(res.statusCode).toBe(422);
  });
});

describe('UPDATE sprint', () => {
  it('should update a sprint if valid info is provided', async () => {
    const res = await request(application)
      .put(`${baseURL}/${SPRINT_SEED._id}`)
      .send({
        ...SPRINT_SEED,
        name: 'updated name',
        description: 'updated description',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      __v: 0,
      createdAt: expect.any(String),
      startDate: expect.any(String),
      description: 'updated description',
      endDate: null,
      id: '63463fb9788a44fa544b4a9a',
      board: '6350d443bddbe8fed0138ffd',
      status: 'planning',
      projectId: '6350d443bddbe8fed0138ffe',
      name: 'updated name',
      ticketId: [],
      updatedAt: expect.any(String),
    });
  });

  it('should update sprint status to active', async () => {
    const res = await request(application)
      .put(`${baseURL}/${SPRINT_SEED._id}`)
      .send({
        status: 'active',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('active');
  });

  it('should update sprint status to completed', async () => {
    const res = await request(application)
      .put(`${baseURL}/${SPRINT_SEED._id}`)
      .send({
        status: 'completed',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  it('should return 404 if no resource found', async () => {
    const res = await request(application).put(`${baseURL}/6350d443bddbe8fed0138ff4`).send({
      name: 'updated name',
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({});
  });
});

describe('GET sprints', () => {
  it('should get all sprints for a project', async () => {
    const res = await request(application).get(
      '/api/v2/projects/6350d443bddbe8fed0138ffe/sprints',
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should filter sprints by status active', async () => {
    const res = await request(application).get(
      '/api/v2/projects/6350d443bddbe8fed0138ffe/sprints?status=active',
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body.every((sprint) => sprint.status === 'active')).toBe(true);
    }
  });

  it('should filter sprints by status planning', async () => {
    const res = await request(application).get(
      '/api/v2/projects/6350d443bddbe8fed0138ffe/sprints?status=planning',
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body.every((sprint) => sprint.status === 'planning')).toBe(true);
    }
  });

  it('should filter sprints by status completed', async () => {
    const res = await request(application).get(
      '/api/v2/projects/6350d443bddbe8fed0138ffe/sprints?status=completed',
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body.every((sprint) => sprint.status === 'completed')).toBe(true);
    }
  });

  it('should get current active sprint', async () => {
    const res = await request(application).get(
      '/api/v2/projects/6350d443bddbe8fed0138ffe/sprints/current',
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body.every((sprint) => sprint.status === 'active')).toBe(true);
    }
  });
});

describe('DELETE sprint', () => {
  it('should delete a sprint with correct id', async () => {
    const res = await request(application).delete(`${baseURL}/${SPRINT_SEED._id}`);
    expect(res.statusCode).toBe(204);
    expect(res.body).toEqual({});
  });

  it('should return 404 with incorrect id', async () => {
    const res = await request(application).delete(`${baseURL}/6350d443b82be8fed0138ff2`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({});
  });
});
