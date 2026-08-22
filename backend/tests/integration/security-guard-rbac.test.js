import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

describe('Tier 8: Security Guard RBAC & Boundary Integration Tests', () => {
  const JWT_SECRET = 'test_secret_123';
  process.env.JWT_SECRET = JWT_SECRET;

  const societyAId = '66c3a1b2c3d4e5f6a7b8c9a1';

  const userSecurityGuard = {
    _id: '66c3a1b2c3d4e5f6a7b8ca02',
    name: 'Officer Guard',
    email: 'guard@society.com',
    role: 'security_guard',
    societyId: societyAId,
    isActive: true,
  };

  const tokenSecurityGuard = jwt.sign(
    { id: userSecurityGuard._id, role: userSecurityGuard.role },
    JWT_SECRET
  );

  let originalFindById;

  before(() => {
    originalFindById = User.findById;
    User.findById = async (id) => {
      if (id?.toString() === userSecurityGuard._id) return userSecurityGuard;
      return null;
    };
  });

  after(() => {
    User.findById = originalFindById;
  });

  it('1. GET /api/payments by security_guard returns 403 Forbidden with NO payment data in body', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${tokenSecurityGuard}`);

    assert.equal(res.status, 403);
    assert.match(res.body.message, /Forbidden/);
    assert.equal(res.body.payments, undefined);
    assert.equal(Array.isArray(res.body), false);
  });

  it('2. GET /api/complaints by security_guard returns 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/complaints')
      .set('Authorization', `Bearer ${tokenSecurityGuard}`);

    assert.equal(res.status, 403);
    assert.match(res.body.message, /Forbidden/);
  });

  it('3. POST /api/payments by security_guard returns 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${tokenSecurityGuard}`)
      .send({ month: '2026-08', amount: 500, bulk: true });

    assert.equal(res.status, 403);
  });

  it('4. PATCH /api/parking/slots/:id/allocate by security_guard returns 403 Forbidden', async () => {
    const res = await request(app)
      .patch('/api/parking/slots/slot_123/allocate')
      .set('Authorization', `Bearer ${tokenSecurityGuard}`)
      .send({ flatId: 'flat_123' });

    assert.equal(res.status, 403);
  });
});
