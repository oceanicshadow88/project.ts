import request from 'supertest';
import sinon from 'sinon';
import mongoose from 'mongoose';
import app from '../setup/app';
import db from '../setup/db';
import * as saasMiddleware from '../../src/app/middleware/saasMiddlewareV2';
import * as claudeService from '../../src/app/services/claudeService';
import * as Ticket from '../../src/app/model/ticket';
import * as User from '../../src/app/model/user';
import { validateChatIntentResult } from '../../src/app/validations/chatIntentResultValidation';
import ProjectBuilder from './builders/projectBuilder';
import TicketBuilder from './builders/ticketBuilder';
import TypeBuilder from './builders/typeBuilder';
import SprintBuilder from './builders/sprintBuilder';
import UserBuilder from './builders/userBuilder';
import PermissionBuilder from './builders/permissionBuilder';
import * as Role from '../../src/app/model/role';

const EMPTY_TICKET = { title: '', type: '', priority: '', assignee: '', sprint: '', description: '' };
const EMPTY_SEARCH = { keyword: '', type: '', priority: '', assignee: '', sprint: '' };

const searchIntent = (search) => ({
  intent: 'search',
  ticket: EMPTY_TICKET,
  search: { ...EMPTY_SEARCH, ...search },
});

const createIntent = (ticket) => ({
  intent: 'create',
  ticket: { ...EMPTY_TICKET, ...ticket },
  search: EMPTY_SEARCH,
});

const sendChat = (projectId, message = 'hello') =>
  request(app.application).post(`/api/v2/projects/${projectId}/ai/chat`).send({ message });

const findType = async (name) => {
  const types = await TypeBuilder.createDefaultTypes();
  return types.find((type) => type.name === name);
};

// The next request runs as a user who is not the tenant owner. By default they have no role
const actAs = (user = {}) => {
  const userId = new mongoose.Types.ObjectId().toString();
  const saasStub = saasMiddleware.saas;
  saasStub.onCall(saasStub.callCount).callsFake((req, res, next) => {
    req.dbConnection = db.dbConnection;
    req.tenantsConnection = db.tenantsConnection;
    req.tenantId = db.defaultTenant._id;
    req.userId = user.id ?? userId;
    req.ownerId = db.defaultUser._id.toString();
    req.user = { projectsRoles: [], ...user };
    return next();
  });
};

// A member of the project whose role has only the given permission
const memberWith = async (project, slug) => {
  const permission = await new PermissionBuilder().withSlug(slug).withDescription(slug).save();
  const role = await Role.getModel(db.dbConnection).create({
    name: 'Test Role',
    slug: 'test-role',
    permissions: [permission._id],
  });
  return { projectsRoles: [{ project: project._id, role: role._id }] };
};

describe('AI chat API', () => {
  let intentStub;

  beforeEach(() => {
    intentStub = sinon.stub(claudeService, 'detectChatIntentByClaude');
  });

  afterEach(() => {
    intentStub.restore();
  });

  describe('search', () => {
    it('should return matching tickets with names and filter chips', async () => {
      const project = await new ProjectBuilder().save();
      const bug = await findType('Bug');
      const ticket = await new TicketBuilder()
        .withProject(project._id)
        .withType(bug._id)
        .withPriority('High')
        .withAssign(db.defaultUser._id)
        .withTitle('Login fails on Safari')
        .save();
      // ticketNumber comes from a save hook that only runs through createTicket
      await Ticket.getModel(db.dbConnection).updateOne({ _id: ticket._id }, { ticketNumber: 12 });
      await new TicketBuilder().withProject(project._id).withType(bug._id).withPriority('Low').save();
      intentStub.resolves(searchIntent({ type: 'bug', priority: 'High', assignee: 'me' }));

      const res = await sendChat(project.id, 'Find my high priority bugs').expect(200);

      expect(res.body.kind).toBe('search_results');
      expect(res.body.text).toBe('Found 1 ticket.');
      expect(res.body.total).toBe(1);
      expect(res.body.tickets[0]).toEqual(
        expect.objectContaining({
          title: 'Login fails on Safari',
          type: 'Bug',
          priority: 'High',
          assignee: db.defaultUser.name,
        }),
      );
      expect(res.body.tickets[0].key).toBe('PRO-12');
      expect(res.body.filters).toEqual([
        { label: 'Type', value: 'bug' },
        { label: 'Priority', value: 'High' },
        { label: 'Assignee', value: 'me' },
      ]);
    });

    it('should return at most 10 tickets with the full total', async () => {
      const project = await new ProjectBuilder().save();
      for (let i = 0; i < 12; i += 1) {
        await new TicketBuilder().withProject(project._id).save();
      }
      intentStub.resolves(searchIntent({ keyword: 'default' }));

      const res = await sendChat(project.id).expect(200);

      expect(res.body.total).toBe(12);
      expect(res.body.tickets).toHaveLength(10);
    });

    it('should find tickets in the current sprint', async () => {
      const project = await new ProjectBuilder().save();
      const sprint = await new SprintBuilder().withProject(project._id).withStatus('active').save();
      const inSprint = await new TicketBuilder().withProject(project._id).withTitle('In sprint').save();
      // TicketBuilder.withSprint sets sprintId, which the ticket schema doesn't keep
      await Ticket.getModel(db.dbConnection).updateOne({ _id: inSprint._id }, { sprint: sprint._id });
      await new TicketBuilder().withProject(project._id).withTitle('In backlog').save();
      intentStub.resolves(searchIntent({ sprint: 'current' }));

      const res = await sendChat(project.id).expect(200);

      expect(res.body.tickets.map((ticket) => ticket.title)).toEqual(['In sprint']);
    });

    it('should match nothing when a name is not in the project', async () => {
      const project = await new ProjectBuilder().save();
      await new TicketBuilder().withProject(project._id).save();
      intentStub.resolves(searchIntent({ assignee: 'Nobody' }));

      const res = await sendChat(project.id).expect(200);

      expect(res.body).toEqual({
        kind: 'search_results',
        text: 'No tickets match.',
        filters: [{ label: 'Assignee', value: 'Nobody' }],
        total: 0,
        tickets: [],
      });
    });
  });

  describe('draft', () => {
    it('should return a draft with ids and not create a ticket', async () => {
      const project = await new ProjectBuilder().save();
      const bug = await findType('Bug');
      const ticketModel = Ticket.getModel(db.dbConnection);
      const ticketCount = await ticketModel.countDocuments();
      intentStub.resolves(
        createIntent({ title: ' Login button does nothing ', type: 'Bug', priority: 'High', assignee: 'me' }),
      );

      const res = await sendChat(project.id, 'Create a bug: login button does nothing').expect(200);

      expect(res.body).toEqual({
        kind: 'ticket_draft',
        text: 'Here is a draft.',
        draft: {
          title: 'Login button does nothing',
          typeId: bug.id,
          priority: 'High',
          assigneeId: db.defaultUser.id,
        },
        missingFields: ['Sprint'],
      });
      expect(await ticketModel.countDocuments()).toBe(ticketCount);
    });

    it('should find a project member by name', async () => {
      const project = await new ProjectBuilder().save();
      const judy = await new UserBuilder().withEmail('judy@example.com').withName('Judy').save();
      await User.getModel(db.tenantsConnection).updateOne(
        { _id: judy._id },
        { projectsRoles: [{ project: project._id }] },
      );
      intentStub.resolves(createIntent({ title: 'Fix the export', assignee: 'judy' }));

      const res = await sendChat(project.id).expect(200);

      expect(res.body.draft.assigneeId).toBe(judy.id);
    });

    it('should leave unknown names empty and list the optional fields', async () => {
      const project = await new ProjectBuilder().save();
      intentStub.resolves(createIntent({ title: 'Fix it', type: 'Epic', assignee: 'Nobody' }));

      const res = await sendChat(project.id).expect(200);

      expect(res.body.draft).toEqual({ title: 'Fix it' });
      expect(res.body.missingFields).toEqual(['Priority', 'Assignee', 'Sprint']);
    });
  });

  describe('other replies and errors', () => {
    it('should return out_of_scope for other requests', async () => {
      const project = await new ProjectBuilder().save();
      intentStub.resolves({ intent: 'other', ticket: EMPTY_TICKET, search: EMPTY_SEARCH });

      const res = await sendChat(project.id, 'Delete all done tickets').expect(200);

      expect(res.body).toEqual({ kind: 'out_of_scope', text: "That's outside what I can do right now." });
    });

    it('should return 500 when Claude fails', async () => {
      const project = await new ProjectBuilder().save();
      intentStub.rejects(new Error('Claude is down'));

      await sendChat(project.id).expect(500);
    });

    it('should return 422 for an empty or too long message', async () => {
      const project = await new ProjectBuilder().save();

      await sendChat(project.id, '   ').expect(422);
      await sendChat(project.id, 'a'.repeat(1001)).expect(422);
      expect(intentStub.called).toBe(false);
    });

    it('should return 422 for an invalid project id', async () => {
      await sendChat('not-an-id').expect(422);
    });

    it('should return 404 for a project in another tenant', async () => {
      const project = await new ProjectBuilder().withTenant(new mongoose.Types.ObjectId()).save();

      await sendChat(project.id).expect(404);
    });

    it('should return 403 for a user who is not the owner or a member', async () => {
      const project = await new ProjectBuilder().save();
      actAs();

      await sendChat(project.id).expect(403);
      expect(intentStub.called).toBe(false);
    });

    it('should allow a super user who is not a member', async () => {
      const project = await new ProjectBuilder().save();
      intentStub.resolves({ intent: 'other', ticket: EMPTY_TICKET, search: EMPTY_SEARCH });
      actAs({ isSuperUser: 1 });

      await sendChat(project.id).expect(200);
    });

    it('should allow the project owner who has no role', async () => {
      const ownerId = new mongoose.Types.ObjectId();
      const project = await new ProjectBuilder().withOwner(ownerId).save();
      intentStub.resolves({ intent: 'other', ticket: EMPTY_TICKET, search: EMPTY_SEARCH });
      actAs({ id: ownerId.toString() });

      await sendChat(project.id).expect(200);
    });

    it('should allow a member whose role has view:tickets', async () => {
      const project = await new ProjectBuilder().save();
      intentStub.resolves({ intent: 'other', ticket: EMPTY_TICKET, search: EMPTY_SEARCH });
      actAs(await memberWith(project, 'view:tickets'));

      await sendChat(project.id).expect(200);
    });

    it('should return 403 for a member whose role lacks view:tickets', async () => {
      const project = await new ProjectBuilder().save();
      actAs(await memberWith(project, 'view:projects'));

      await sendChat(project.id).expect(403);
      expect(intentStub.called).toBe(false);
    });
  });
});

describe('validateChatIntentResult', () => {
  it('should fill missing fields with empty strings', async () => {
    await expect(validateChatIntentResult({ intent: 'other' })).resolves.toEqual({
      intent: 'other',
      ticket: EMPTY_TICKET,
      search: EMPTY_SEARCH,
    });
  });

  it('should reject an unknown intent', async () => {
    await expect(validateChatIntentResult({ intent: 'delete' })).rejects.toThrow(
      'Invalid chat intent result',
    );
  });

  it('should reject a priority outside the list', async () => {
    await expect(
      validateChatIntentResult({ intent: 'create', ticket: { priority: 'Urgent' } }),
    ).rejects.toThrow('Invalid chat intent result');
  });
});

describe('Improve Ticket Title access (unchanged by TS-48)', () => {
  let titleStub;

  beforeEach(() => {
    titleStub = sinon
      .stub(claudeService, 'validateTicketTitleByClaude')
      .resolves({ classification: 'clear', recommendedTitle: 'A title', reason: 'Clear' });
  });

  afterEach(() => {
    titleStub.restore();
  });

  const validateTitle = (ticket) =>
    request(app.application).post(`/api/v2/tickets/${ticket.id}/validate-title`);

  it('should allow any project member, whatever the role permits', async () => {
    const project = await new ProjectBuilder().save();
    const ticket = await new TicketBuilder().withProject(project._id).save();
    actAs(await memberWith(project, 'view:projects'));

    await validateTitle(ticket).expect(200);
  });

  it('should still return 403 for a super user who is not a member', async () => {
    const project = await new ProjectBuilder().save();
    const ticket = await new TicketBuilder().withProject(project._id).save();
    actAs({ isSuperUser: 1 });

    await validateTitle(ticket).expect(403);
    expect(titleStub.called).toBe(false);
  });
});
