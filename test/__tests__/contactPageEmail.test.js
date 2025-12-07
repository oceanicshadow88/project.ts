import request from 'supertest';
import app from '../setup/app';

describe('Post /emailus', () => {
  it('should return a 400 status code for invalid req.body', async () => {
    const invalidForm = {
      fullName: 'zhou test',
      company: 'testing company',
      phone: '9876543', // Invalid phone (too short)
      email: 'egglord@example.com',
      message: 'hello i am testing from insomina👻',
      title: "I'm confused about how something works",
    };
    
    const res = await request(app.application).post('/api/v2/emailus').send(invalidForm);
    
    expect(res.statusCode).toEqual(400);
  });

  it('should return a 202 status code for valid req.body', async () => {
    const validForm = {
      fullName: 'zhou test',
      company: 'testing company',
      phone: '9876543210',
      email: 'egglord@example.com',
      message: 'hello i am pass test from jest unit test👻',
      title: "I'm confused about how something works",
    };
    
    const res = await request(app.application).post('/api/v2/emailus').send(validForm);
    
    expect(res.statusCode).toEqual(202);
  });
});
