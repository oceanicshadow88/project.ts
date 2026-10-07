import request from 'supertest';
import { ObjectId } from 'mongodb';
import app from '../setup/app';
import db from '../setup/db';
import * as Project from '../../src/app/model/project';
import * as Ticket from '../../src/app/model/ticket';
import ProjectBuilder from './builders/projectBuilder';
import TicketBuilder from './builders/ticketBuilder';
import EpicBuilder from './builders/epicBuilder';
import SprintBuilder from './builders/sprintBuilder';
import CommentBuilder from './builders/commentBuilder';
import BoardBuilder from './builders/boardBuilder';

const otherTenantId = new ObjectId().toString();
const createOtherTenantProject = () => new ProjectBuilder().withTenant(otherTenantId).save();

describe('Tenant isolation', () => {
  describe('projects', () => {
    it('should not return project details for another tenant', async () => {
      const project = await createOtherTenantProject();

      await request(app.application).get(`/api/v2/projects/${project.id}/details`).expect(500);
    });

    it('should not update a project belonging to another tenant', async () => {
      const project = await createOtherTenantProject();

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
        .send({ tenant: otherTenantId });

      const unchanged = await Project.getModel(db.dbConnection).findById(project.id);
      expect(unchanged.tenant).toEqual(db.defaultTenant._id.toString());
    });

    it('should still return project details for own tenant', async () => {
      const project = await new ProjectBuilder().save();

      await request(app.application).get(`/api/v2/projects/${project.id}/details`).expect(200);
    });
  });

  describe('tickets', () => {
    it('should not show a ticket from another tenant project', async () => {
      const project = await createOtherTenantProject();
      const ticket = await new TicketBuilder().withProject(project).save();

      await request(app.application).get(`/api/v2/tickets/${ticket.id}`).expect(500);
    });

    it('should not update a ticket from another tenant project', async () => {
      const project = await createOtherTenantProject();
      const ticket = await new TicketBuilder().withProject(project).save();

      await request(app.application)
        .put(`/api/v2/tickets/${ticket.id}`)
        .send({ title: 'hacked' })
        .expect(500);

      const unchanged = await Ticket.getModel(db.dbConnection).findById(ticket.id);
      expect(unchanged.title).toEqual(ticket.title);
    });

    it('should not delete a ticket from another tenant project', async () => {
      const project = await createOtherTenantProject();
      const ticket = await new TicketBuilder().withProject(project).save();

      await request(app.application).delete(`/api/v2/tickets/${ticket.id}`).expect(500);

      const stillThere = await Ticket.getModel(db.dbConnection).findById(ticket.id);
      expect(stillThere).not.toBeNull();
    });

    it('should not create a ticket in another tenant project', async () => {
      const project = await createOtherTenantProject();
      const ticket = await new TicketBuilder().buildDefault();

      await request(app.application)
        .post('/api/v2/tickets')
        .send({ ...ticket, projectId: project.id })
        .expect(500);
    });

    it('should not move own ticket into another tenant project', async () => {
      const otherProject = await createOtherTenantProject();
      const ticket = await new TicketBuilder().save();

      await request(app.application)
        .put(`/api/v2/tickets/${ticket.id}`)
        .send({ project: otherProject.id })
        .expect(500);

      const unchanged = await Ticket.getModel(db.dbConnection).findById(ticket.id);
      expect(unchanged.project.toString()).toEqual(ticket.project.toString());
    });

    it('should not list tickets of an epic from another tenant project', async () => {
      const project = await createOtherTenantProject();
      const epic = await new EpicBuilder().withProject(project).save();

      await request(app.application).get(`/api/v2/tickets/epic/${epic.id}`).expect(500);
    });
  });

  describe('routes with a projectId param', () => {
    it('should not return backlog of another tenant project', async () => {
      const project = await createOtherTenantProject();

      await request(app.application).get(`/api/v2/projects/${project.id}/backlogs`).expect(500);
    });

    it('should not return epics of another tenant project', async () => {
      const project = await createOtherTenantProject();

      await request(app.application).get(`/api/v2/epics/project/${project.id}`).expect(500);
    });

    it('should not return the current sprint of another tenant project', async () => {
      const project = await createOtherTenantProject();

      await request(app.application)
        .get(`/api/v2/projects/${project.id}/sprints/current`)
        .expect(500);
    });

    it('should still return backlog of own tenant project', async () => {
      const project = await new ProjectBuilder().save();

      await request(app.application).get(`/api/v2/projects/${project.id}/backlogs`).expect(200);
    });
  });

  describe('epics', () => {
    it('should not show an epic from another tenant project', async () => {
      const project = await createOtherTenantProject();
      const epic = await new EpicBuilder().withProject(project).save();

      await request(app.application).get(`/api/v2/epics/${epic.id}`).expect(500);
    });

    it('should not create an epic in another tenant project', async () => {
      const project = await createOtherTenantProject();
      const epic = await new EpicBuilder().buildDefault();

      await request(app.application)
        .post('/api/v2/epics')
        .send({ ...epic, project: project.id })
        .expect(500);
    });
  });

  describe('comments and activities', () => {
    it('should not list comments of a ticket from another tenant project', async () => {
      const project = await createOtherTenantProject();
      const ticket = await new TicketBuilder().withProject(project).save();
      await new CommentBuilder().withTicket(ticket).save();

      await request(app.application).get(`/api/v2/comments/${ticket.id}`).expect(500);
    });

    it('should not list activities of a ticket from another tenant project', async () => {
      const project = await createOtherTenantProject();
      const ticket = await new TicketBuilder().withProject(project).save();

      await request(app.application).get(`/api/v2/activities/${ticket.id}`).expect(500);
    });
  });

  describe('sprints and boards', () => {
    it('should not list tickets of a sprint from another tenant project', async () => {
      const project = await createOtherTenantProject();
      const sprint = await new SprintBuilder().withProject(project).save();

      await request(app.application).get(`/api/v2/sprints/${sprint.id}/tickets`).expect(500);
    });

    it('should not update a sprint from another tenant project', async () => {
      const project = await createOtherTenantProject();
      const sprint = await new SprintBuilder().withProject(project).save();

      await request(app.application)
        .put(`/api/v2/sprints/${sprint.id}`)
        .send({ name: 'hacked' })
        .expect(500);
    });

    it('should not return a board belonging to another tenant', async () => {
      const board = await new BoardBuilder().withTenant(otherTenantId).save();

      const res = await request(app.application).get(`/api/v2/board/${board._id}`);

      expect(res.body?.id).toBeUndefined();
    });
  });

  describe('shortcuts', () => {
    it('should not add a shortcut to another tenant project', async () => {
      const project = await createOtherTenantProject();

      await request(app.application)
        .post(`/api/v2/projects/${project.id}/shortcuts`)
        .send({ shortcutLink: 'https://example.com', name: 'hacked' })
        .expect(500);

      const unchanged = await Project.getModel(db.dbConnection).findById(project.id);
      expect(unchanged.shortcut).toHaveLength(0);
    });
  });
});
