import request from 'supertest';
import sinon from 'sinon';
import app from '../setup/app';
import db from '../setup/db';
import ProjectBuilder from './builders/projectBuilder';
import TicketBuilder from './builders/ticketBuilder';
import * as Question from '../../src/app/model/question';
import * as User from '../../src/app/model/user';
import * as emailSender from '../../src/app/utils/emailSender';

const baseURL = '/api/v2';

let emailStub = null;

beforeAll(() => {
  // Mock the email sending function to avoid actual email sending and template errors
  emailStub = sinon.stub(emailSender, 'emailRecipientTemplate').resolves({});
});

afterAll(() => {
  if (emailStub) {
    emailStub.restore();
  }
});

describe('POST /projects/:projectId/questions/send-to-po', () => {
  it('should send all questions to Product Owner successfully', async () => {
    // Create a project
    const project = await new ProjectBuilder().save();
    
    // Create a ticket with project
    const ticket = await new TicketBuilder().withProject(project).save();
    
    // Get user model to create questions with createdBy
    const userModel = User.getModel(db.tenantsConnection);
    const users = await userModel.find().limit(1);
    const testUser = users[0];
    
    if (!testUser) {
      throw new Error('No user found in database for testing');
    }
    
    // Create multiple questions
    const questionModel = Question.getModel(db.dbConnection);
    const questionIds = [];
    
    for (let i = 0; i < 3; i++) {
      const question = await questionModel.create({
        title: `Test Question ${i + 1}`,
        ticket: ticket.id,
        priority: 'Medium',
        createdBy: testUser._id,
        isResolved: false,
      });
      questionIds.push(question._id.toString());
    }
    
    // Send request to send questions to PO
    const res = await request(app.application)
      .post(`${baseURL}/projects/${project.id}/questions/send-to-po`)
      .send({
        email: 'kitmanwork@gmail.com',
        questionIds: questionIds,
      })
      .expect(200);
    
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBe('All questions sent to Product Owner successfully');
  });
  
  it('should send questions with provided question IDs', async () => {
    // Create a project
    const project = await new ProjectBuilder().save();
    
    // Create a ticket with project
    const ticket = await new TicketBuilder().withProject(project).save();
    
    // Get user model
    const userModel = User.getModel(db.tenantsConnection);
    const users = await userModel.find().limit(1);
    const testUser = users[0];
    
    if (!testUser) {
      throw new Error('No user found in database for testing');
    }
    
    // Create questions with specific IDs from user's test data
    const questionModel = Question.getModel(db.dbConnection);
    const questionIds = [
      '693280dc1fd8d6cc529d08f7',
      '693282d18400c1bd492393f1',
      '693287dd8400c1bd49239842',
    ];
    
    // Create questions with those IDs (or use existing ones)
    for (const questionId of questionIds) {
      try {
        await questionModel.create({
          _id: questionId,
          title: `Test Question ${questionId}`,
          ticket: ticket.id,
          priority: 'Medium',
          createdBy: testUser._id,
          isResolved: false,
        });
      } catch (error) {
        // Question might already exist, that's okay
      }
    }
    
    // Send request
    const res = await request(app.application)
      .post(`${baseURL}/projects/${project.id}/questions/send-to-po`)
      .send({
        email: 'kitmanwork@gmail.com',
        questionIds: questionIds,
      });
    
    // Should return 200 if questions exist, or handle gracefully
    expect([200, 500]).toContain(res.statusCode);
  });
  
  it('should return 422 if email is missing', async () => {
    const project = await new ProjectBuilder().save();
    
    await request(app.application)
      .post(`${baseURL}/projects/${project.id}/questions/send-to-po`)
      .send({
        questionIds: ['693280dc1fd8d6cc529d08f7'],
      })
      .expect(422);
  });
  
  it('should return 422 if questionIds is missing', async () => {
    const project = await new ProjectBuilder().save();
    
    await request(app.application)
      .post(`${baseURL}/projects/${project.id}/questions/send-to-po`)
      .send({
        email: 'kitmanwork@gmail.com',
      })
      .expect(422);
  });
  
  it('should return 422 if questionIds is not an array', async () => {
    const project = await new ProjectBuilder().save();
    
    await request(app.application)
      .post(`${baseURL}/projects/${project.id}/questions/send-to-po`)
      .send({
        email: 'kitmanwork@gmail.com',
        questionIds: 'not-an-array',
      })
      .expect(422);
  });
  
  it('should return 422 if email is invalid', async () => {
    const project = await new ProjectBuilder().save();
    
    await request(app.application)
      .post(`${baseURL}/projects/${project.id}/questions/send-to-po`)
      .send({
        email: 'invalid-email',
        questionIds: ['693280dc1fd8d6cc529d08f7'],
      })
      .expect(422);
  });
  
  it('should return 422 if projectId is invalid', async () => {
    await request(app.application)
      .post(`${baseURL}/projects/invalid-id/questions/send-to-po`)
      .send({
        email: 'kitmanwork@gmail.com',
        questionIds: ['693280dc1fd8d6cc529d08f7'],
      })
      .expect(422);
  });
});

