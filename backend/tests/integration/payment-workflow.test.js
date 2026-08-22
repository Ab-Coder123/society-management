import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Flat from '../../src/models/Flat.js';
import Payment from '../../src/models/Payment.js';

describe('Tier 8: Payment Workflow Integration Tests', () => {
  const JWT_SECRET = 'test_secret_123';
  process.env.JWT_SECRET = JWT_SECRET;

  const societyAId = '66c3a1b2c3d4e5f6a7b8c9a1';

  const userAdminA = {
    _id: '66c3a1b2c3d4e5f6a7b8ca01',
    name: 'Admin A',
    email: 'adminA@society.com',
    role: 'society_admin',
    societyId: societyAId,
    isActive: true,
  };

  const userOwnerA = {
    _id: '66c3a1b2c3d4e5f6a7b8ca02',
    name: 'Owner A',
    email: 'ownerA@society.com',
    role: 'owner',
    societyId: societyAId,
    flatId: '66c3a1b2c3d4e5f6a7b8cf01',
    isActive: true,
  };

  const userResidentA = {
    _id: '66c3a1b2c3d4e5f6a7b8ca03',
    name: 'Resident A',
    email: 'residentA@society.com',
    role: 'resident',
    societyId: societyAId,
    flatId: '66c3a1b2c3d4e5f6a7b8cf01',
    isActive: true,
  };

  const tokenAdminA    = jwt.sign({ id: userAdminA._id, role: userAdminA.role }, JWT_SECRET);
  const tokenOwnerA    = jwt.sign({ id: userOwnerA._id, role: userOwnerA.role }, JWT_SECRET);
  const tokenResidentA = jwt.sign({ id: userResidentA._id, role: userResidentA.role }, JWT_SECRET);

  let originalFindById;
  let originalFlatFind;
  let originalPaymentCreate;
  let originalPaymentFind;

  const inMemoryFlats = [
    { _id: '66c3a1b2c3d4e5f6a7b8cf01', societyId: societyAId, building: 'A', flatNumber: '101', ownerId: userOwnerA._id },
    { _id: '66c3a1b2c3d4e5f6a7b8cf02', societyId: societyAId, building: 'A', flatNumber: '102', ownerId: null },
  ];
  const inMemoryPayments = [];

  before(() => {
    originalFindById = User.findById;
    User.findById = async (id) => {
      const idStr = id?.toString();
      if (idStr === userAdminA._id) return userAdminA;
      if (idStr === userOwnerA._id) return userOwnerA;
      if (idStr === userResidentA._id) return userResidentA;
      return null;
    };

    originalFlatFind = Flat.find;
    Flat.find = async (filter) => {
      return inMemoryFlats.filter((f) => f.societyId === filter.societyId);
    };

    originalPaymentCreate = Payment.create;
    Payment.create = async (data) => {
      // Check duplicate index
      const exists = inMemoryPayments.some(
        (p) => p.societyId === data.societyId && p.flatId === data.flatId && p.month === data.month
      );
      if (exists) {
        const err = new Error('Duplicate key error');
        err.code = 11000;
        throw err;
      }
      const doc = {
        _id: `pay_${Date.now()}_${Math.random()}`,
        ...data,
        status: data.status || 'pending',
        createdAt: new Date(),
      };
      inMemoryPayments.push(doc);
      return doc;
    };

    originalPaymentFind = Payment.find;
    Payment.find = (filter) => {
      const results = inMemoryPayments.filter((p) => {
        if (filter.societyId && p.societyId !== filter.societyId) return false;
        if (filter.flatId && p.flatId !== filter.flatId) return false;
        if (filter.month && p.month !== filter.month) return false;
        if (filter.status && p.status !== filter.status) return false;
        return true;
      });

      return {
        populate: () => ({
          populate: () => ({
            sort: () => results,
          }),
        }),
      };
    };
  });

  after(() => {
    User.findById = originalFindById;
    Flat.find = originalFlatFind;
    Payment.create = originalPaymentCreate;
    Payment.find = originalPaymentFind;
  });

  it('1. society_admin can bulk create charges for all flats in a month', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({
        bulk: true,
        month: '2026-08',
        amount: 200,
        type: 'maintenance',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.created, 2);
    assert.equal(res.body.skipped.length, 0);
  });

  it('2. duplicate bulk createCharge skips existing charges without erroring', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({
        bulk: true,
        month: '2026-08',
        amount: 200,
        type: 'maintenance',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.created, 0);
    assert.equal(res.body.skipped.length, 2);
  });

  it('3. owner can view payments for their flat', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${tokenOwnerA}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].flatId, userOwnerA.flatId);
  });

  it('4. resident attempting GET /api/payments receives 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${tokenResidentA}`);

    assert.equal(res.status, 403);
    assert.match(res.body.message, /Forbidden/);
  });
});
