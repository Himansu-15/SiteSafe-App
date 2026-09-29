import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Incident } from '../src/models/Incident.js';
import authRoutes from '../src/routes/auth.js';
import incidentRoutes from '../src/routes/incidents.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('Workflow & RBAC Tests', () => {
  let app;
  let adminCookie, reporterCookie;
  let incidentId;

  beforeEach(async () => {
    app = createTestApp();

    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Admin', email: 'admin@test.com', password: 'password', orgName: 'Org', role: 'admin'
    });
    adminCookie = adminRes.headers['set-cookie'].find(c => c.startsWith('accessToken='));
    const siteId = adminRes.body.data.organization.sites[0]._id;

    const repRes = await request(app).post('/api/auth/register').send({
      name: 'Reporter', email: 'reporter@test.com', password: 'password', orgName: 'Org', role: 'reporter'
    });
    reporterCookie = repRes.headers['set-cookie'].find(c => c.startsWith('accessToken='));

    const incRes = await request(app)
      .post('/api/incidents')
      .set('Cookie', adminCookie)
      .field('title', 'Test Incident')
      .field('description', 'Test desc')
      .field('type', 'hazard')
      .field('severity', 'low')
      .field('siteId', siteId);
    
    incidentId = incRes.body.data.incident._id;
  });

  afterEach(async () => {
    await Incident.deleteMany({});
    await User.deleteMany({});
    await Organization.deleteMany({});
  });

  it('Reporter cannot change status', async () => {
    const res = await request(app)
      .patch(`/api/incidents/${incidentId}/status`)
      .set('Cookie', reporterCookie)
      .send({ status: 'investigating' })
      .expect(403);
  });

  it('Admin can change status, but skipping is blocked', async () => {
    const res = await request(app)
      .patch(`/api/incidents/${incidentId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'closed' }) // Skipped investigating and action_pending
      .expect(400);

    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  it('Admin can do valid transition', async () => {
    const res = await request(app)
      .patch(`/api/incidents/${incidentId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'investigating' })
      .expect(200);

    expect(res.body.data.incident.status).toBe('investigating');
  });
});
