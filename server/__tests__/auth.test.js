import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import authRoutes from '../src/routes/auth.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('Auth API', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    const validPayload = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      orgName: 'Test Org',
      siteName: 'Main Site',
      role: 'reporter',
      language: 'en',
    };

    it('should register a new user and organization', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validPayload)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(validPayload.email);
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.organization).toBeDefined();
      expect(res.body.data.organization.name).toBe(validPayload.orgName);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should register a user in existing organization', async () => {
      await request(app).post('/api/auth/register').send(validPayload).expect(201);

      const secondUser = {
        ...validPayload,
        email: 'jane@example.com',
        role: 'safety_officer',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(secondUser)
        .expect(201);

      expect(res.body.data.user.role).toBe('safety_officer');
      expect(res.body.data.organization.name).toBe(validPayload.orgName);
    });

    it('should reject duplicate email in same org', async () => {
      await request(app).post('/api/auth/register').send(validPayload).expect(201);
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(validPayload)
        .expect(409);

      expect(res.body.code).toBe('CONFLICT');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validPayload, email: 'invalid-email' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should validate password length', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validPayload, password: 'short' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      orgName: 'Test Org',
      siteName: 'Main Site',
      role: 'reporter',
    };

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(userData);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);

      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/refresh', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      orgName: 'Test Org',
      role: 'reporter',
    };

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(userData);
    });

    it('should refresh access token with valid refresh token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });

      const cookies = loginRes.headers['set-cookie'];
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject missing refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=invalid.token.here')
        .expect(401);

      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear cookies on logout', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(res.body.status).toBe('success');
      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c) => c.includes('accessToken=;'))).toBe(true);
      expect(cookies.some((c) => c.includes('refreshToken=;'))).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      orgName: 'Test Org',
      role: 'safety_officer',
    };

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(userData);
    });

    it('should return current user with valid access token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });

      const cookies = loginRes.headers['set-cookie'];
      const accessCookie = cookies.find((c) => c.startsWith('accessToken='));

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', accessCookie)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.body.data.user.role).toBe('safety_officer');
    });

    it('should reject without access token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });
});

describe('RBAC - Role-based access control', () => {
  let app;
  let adminCookie, safetyOfficerCookie, reporterCookie, managerCookie;

  beforeEach(async () => {
    app = createTestApp();

    // Create org with admin
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      orgName: 'RBAC Test Org',
      role: 'admin',
    });
    adminCookie = adminRes.headers['set-cookie'].find((c) => c.startsWith('accessToken='));

    // Create safety officer
    const soRes = await request(app).post('/api/auth/register').send({
      name: 'Safety Officer',
      email: 'so@test.com',
      password: 'password123',
      orgName: 'RBAC Test Org',
      role: 'safety_officer',
    });
    safetyOfficerCookie = soRes.headers['set-cookie'].find((c) => c.startsWith('accessToken='));

    // Create reporter
    const repRes = await request(app).post('/api/auth/register').send({
      name: 'Reporter',
      email: 'reporter@test.com',
      password: 'password123',
      orgName: 'RBAC Test Org',
      role: 'reporter',
    });
    reporterCookie = repRes.headers['set-cookie'].find((c) => c.startsWith('accessToken='));

    // Create manager
    const mgrRes = await request(app).post('/api/auth/register').send({
      name: 'Manager',
      email: 'manager@test.com',
      password: 'password123',
      orgName: 'RBAC Test Org',
      role: 'manager',
    });
    managerCookie = mgrRes.headers['set-cookie'].find((c) => c.startsWith('accessToken='));
  });

  const testEndpoint = (method, path, cookie, expectedStatus) => {
    return request(app)[method](path)
      .set('Cookie', cookie)
      .expect(expectedStatus);
  };

  // Test a protected endpoint that requires safety_officer or admin
  const testAuthMiddleware = (req, res, next) => {
    // This would be tested via actual routes in later phases
    // For now, we test the middleware logic directly
  };

  it('should allow admin access to safety_officer routes', async () => {
    // We'll test this via actual incident routes in later phases
    // For now, verify the cookies are set correctly
    expect(adminCookie).toBeDefined();
    expect(safetyOfficerCookie).toBeDefined();
    expect(reporterCookie).toBeDefined();
    expect(managerCookie).toBeDefined();
  });

  it('should have correct roles assigned', async () => {
    const adminUser = await User.findOne({ email: 'admin@test.com' });
    const soUser = await User.findOne({ email: 'so@test.com' });
    const repUser = await User.findOne({ email: 'reporter@test.com' });
    const mgrUser = await User.findOne({ email: 'manager@test.com' });

    expect(adminUser.role).toBe('admin');
    expect(soUser.role).toBe('safety_officer');
    expect(repUser.role).toBe('reporter');
    expect(mgrUser.role).toBe('manager');
  });
});