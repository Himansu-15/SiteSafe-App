import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Incident } from '../src/models/Incident.js';
import authRoutes from '../src/routes/auth.js';
import incidentRoutes from '../src/routes/incidents.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';

// Mock Cloudinary upload
jest.mock('../src/utils/cloudinary.js', () => ({
  uploadToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' })
}));

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

describe('Incident API - Org Isolation', () => {
  let app;
  let org1Id, org2Id;
  let userOrg1Cookie, userOrg2Cookie;
  let site1Id, site2Id;

  beforeEach(async () => {
    app = createTestApp();

    // Register User 1 in Org A
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'User Org 1',
      email: 'user1@org1.com',
      password: 'password123',
      orgName: 'Org A',
      siteName: 'Site A1',
      role: 'reporter',
    });
    userOrg1Cookie = res1.headers['set-cookie'].find(c => c.startsWith('accessToken='));
    org1Id = res1.body.data.organization.id;
    site1Id = res1.body.data.organization.sites[0]._id;

    // Register User 2 in Org B
    const res2 = await request(app).post('/api/auth/register').send({
      name: 'User Org 2',
      email: 'user2@org2.com',
      password: 'password123',
      orgName: 'Org B',
      siteName: 'Site B1',
      role: 'reporter',
    });
    userOrg2Cookie = res2.headers['set-cookie'].find(c => c.startsWith('accessToken='));
    org2Id = res2.body.data.organization.id;
    site2Id = res2.body.data.organization.sites[0]._id;

    // Seed Incident in Org A
    await request(app)
      .post('/api/incidents')
      .set('Cookie', userOrg1Cookie)
      .field('title', 'Incident in Org A')
      .field('description', 'This should only be visible to Org A')
      .field('type', 'injury')
      .field('severity', 'high')
      .field('siteId', site1Id);
  });

  afterEach(async () => {
    await Incident.deleteMany({});
    await User.deleteMany({});
    await Organization.deleteMany({});
  });

  it('User from Org 1 should see Org 1 incidents', async () => {
    const res = await request(app)
      .get('/api/incidents')
      .set('Cookie', userOrg1Cookie)
      .expect(200);

    expect(res.body.data.incidents.length).toBe(1);
    expect(res.body.data.incidents[0].title).toBe('Incident in Org A');
  });

  it('User from Org 2 should NOT see Org 1 incidents', async () => {
    const res = await request(app)
      .get('/api/incidents')
      .set('Cookie', userOrg2Cookie)
      .expect(200);

    expect(res.body.data.incidents.length).toBe(0);
  });

  it('User from Org 2 should get 404 when directly requesting Org 1 incident ID', async () => {
    // Get the ID of the incident created in Org A
    const res1 = await request(app).get('/api/incidents').set('Cookie', userOrg1Cookie);
    const incidentId = res1.body.data.incidents[0]._id;

    const res2 = await request(app)
      .get(`/api/incidents/${incidentId}`)
      .set('Cookie', userOrg2Cookie)
      .expect(404);

    expect(res2.body.code).toBe('NOT_FOUND');
  });
});
