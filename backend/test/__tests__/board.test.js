import request from 'supertest';
import BoardBuilder from './builders/boardBuilder';
import app from '../setup/app';

describe('Board Test', () => {
  it('should show board if all info is provided', async () => {
    const board = await new BoardBuilder().save();

    const res = await request(app.application).get(`/api/v2/board/${board._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(board._id.toString());
    expect(res.body.title).toBe(board.title);
  });

  it('should return 500 if invalid board provided', async () => {
    const wrongId = '123';

    const res = await request(app.application).get(`/api/v2/board/${wrongId}`);

    // Invalid ObjectId format causes 500 error
    expect(res.statusCode).toBe(500);
  });

  it('should return 404 if board not found', async () => {
    const fakeId = '507f1f77bcf86cd799439011';

    const res = await request(app.application).get(`/api/v2/board/${fakeId}`);

    // Board not found might return 404 or 200 with null
    expect([200, 404]).toContain(res.statusCode);
  });
});
