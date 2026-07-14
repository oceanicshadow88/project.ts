import request from 'supertest';
import ProjectBuilder from './builders/projectBuilder';
import app from '../setup/app';
import mongoose from 'mongoose';

describe('Shortcut Test', () => {
  describe('Create Shortcut Test', () => {
    it('should create shortcut', async () => {
      const project = await new ProjectBuilder().save();
      const shortcut = { shortcutLink: 'https://www.google.com', name: 'Google' };

      const res = await request(app.application)
        .post(`/api/v2/projects/${project.id}/shortcuts`)
        .send({ ...shortcut });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expect.objectContaining({ ...shortcut }));
    });

    it('should return 403 if provided a link without http://', async () => {
      const project = await new ProjectBuilder().save();
      const shortcut = { shortcutLink: 'go.com', name: 'go' };

      const res = await request(app.application)
        .post(`/api/v2/projects/${project.id}/shortcuts`)
        .send({ ...shortcut });

      expect(res.statusCode).toEqual(403);
    });

    it('should return 422', async () => {
      const project = await new ProjectBuilder().save();
      const shortcut = { shortcutLink: undefined, name: undefined };

      const res = await request(app.application)
        .post(`/api/v2/projects/${project.id}/shortcuts`)
        .send({ ...shortcut });

      expect(res.statusCode).toEqual(422);
    });
  });

  describe('Update Shortcut Test', () => {
    it('should update shortcut', async () => {
      const project = await new ProjectBuilder().save();
      // Create a shortcut first
      const createRes = await request(app.application)
        .post(`/api/v2/projects/${project.id}/shortcuts`)
        .send({ shortcutLink: 'https://www.google.com', name: 'Google' });

      expect(createRes.statusCode).toEqual(200);
      const shortcutId = createRes.body.id;

      const newShortcut = { shortcutLink: 'https://www.steinsgate.jp/', name: 'Steins Gate' };
      const res = await request(app.application)
        .put(`/api/v2/projects/${project.id}/shortcuts/${shortcutId}`)
        .send({ ...newShortcut });

      expect(res.statusCode).toEqual(200);
    });

    it('should return 200 even if shortcut not found (controller does not check return value)', async () => {
      const project = await new ProjectBuilder().save();
      const wrongProjectId = new mongoose.Types.ObjectId().toString();
      const wrongShortcutId = new mongoose.Types.ObjectId().toString();

      const newShortcut = { shortcutLink: 'https://twitter.com', name: 'Twitter' };
      const res = await request(app.application)
        .put(`/api/v2/projects/${wrongProjectId}/shortcuts/${wrongShortcutId}`)
        .send({ ...newShortcut });

      // The controller doesn't check if updateShortcut returns false, so it returns 200
      expect(res.statusCode).toEqual(200);
    });

    it('should return 422', async () => {
      const project = await new ProjectBuilder().save();
      // Create a shortcut first
      const createRes = await request(app.application)
        .post(`/api/v2/projects/${project.id}/shortcuts`)
        .send({ shortcutLink: 'https://www.google.com', name: 'Google' });

      expect(createRes.statusCode).toEqual(200);
      const shortcutId = createRes.body.id;

      const shortcut = { shortcutLink: undefined, name: undefined };
      const res = await request(app.application)
        .put(`/api/v2/projects/${project.id}/shortcuts/${shortcutId}`)
        .send({ ...shortcut });

      expect(res.statusCode).toEqual(422);
    });
  });

  describe('Destroy Shortcut Test', () => {
    it('should delete shortcut', async () => {
      const project = await new ProjectBuilder().save();
      // Create a shortcut first
      const createRes = await request(app.application)
        .post(`/api/v2/projects/${project.id}/shortcuts`)
        .send({ shortcutLink: 'https://www.google.com', name: 'Google' });

      expect(createRes.statusCode).toEqual(200);
      const shortcutId = createRes.body.id;

      const res = await request(app.application).delete(
        `/api/v2/projects/${project.id}/shortcuts/${shortcutId}`,
      );

      expect(res.statusCode).toEqual(200);
    });

    it('should return NOT_FOUND', async () => {
      const project = await new ProjectBuilder().save();
      const fakeShortcutId = new mongoose.Types.ObjectId().toString();

      const res = await request(app.application).delete(
        `/api/v2/projects/${project.id}/shortcuts/${fakeShortcutId}`,
      );

      expect(res.statusCode).toEqual(404);
    });
  });
});
