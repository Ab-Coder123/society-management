import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Visitor from '../../src/models/Visitor.js';

describe('Tier 8: Visitor Workflow Integration Tests', () => {
  const JWT_SECRET = 'test_secret_123';
  process.env.JWT_SECRET = JWT_SECRET;

  const societyAId = '66c3a1b2c3d4e5f6a7b8c9a1';
  const societyBId = '66c3a1b2c3d4e5f6a7b8c9b2';

  const userOwnerA = {
    _id: '66c3a1b2c3d4e5f6a7b8ca01',
    name: 'Owner A',
    email: 'ownerA@society.com',
    role: 'owner',
    societyId: societyAId,
    flatId: '66c3a1b2c3d4e5f6a7b8cf01',
    isActive: true,
  };

  const userSecurityA = {
    _id: '66c3a1b2c3d4e5f6a7b8ca02',
    name: 'Guard A',
    email: 'guardA@society.com',
    role: 'security_guard',
    societyId: societyAId,
    isActive: true,
  };

  const userSecurityB = {
    _id: '66c3a1b2c3d4e5f6a7b8cb01',
    name: 'Guard B',
    email: 'guardB@society.com',
    role: 'security_guard',
    societyId: societyBId,
    isActive: true,
  };

  const tokenOwnerA    = jwt.sign({ id: userOwnerA._id, role: userOwnerA.role }, JWT_SECRET);
  const tokenSecurityA = jwt.sign({ id: userSecurityA._id, role: userSecurityA.role }, JWT_SECRET);
  const tokenSecurityB = jwt.sign({ id: userSecurityB._id, role: userSecurityB.role }, JWT_SECRET);

  let originalFindById;
  let originalVisitorCreate;
  let originalVisitorFind;
  let originalVisitorFindById;

  const inMemoryVisitors = [];

  before(() => {
    originalFindById = User.findById;
    User.findById = async (id) => {
      const idStr = id?.toString();
      if (idStr === userOwnerA._id) return userOwnerA;
      if (idStr === userSecurityA._id) return userSecurityA;
      if (idStr === userSecurityB._id) return userSecurityB;
      return null;
    };

    originalVisitorCreate = Visitor.create;
    Visitor.create = async (data) => {
      const doc = {
        _id: `vis_${Date.now()}_${Math.random()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryVisitors.push(doc);
      return doc;
    };

    originalVisitorFind = Visitor.find;
    Visitor.find = (filter) => {
      let results = inMemoryVisitors.filter((v) => {
        if (filter.societyId && v.societyId !== filter.societyId) return false;
        if (filter.flatId && v.flatId !== filter.flatId) return false;
        return true;
      });

      return {
        populate: () => ({
          populate: () => ({
            populate: () => ({
              sort: () => results,
            }),
          }),
        }),
      };
    };

    originalVisitorFindById = Visitor.findById;
    Visitor.findById = (id) => {
      const found = inMemoryVisitors.find((v) => v._id === id);
      if (!found) {
        return {
          populate: () => ({ populate: () => ({ populate: () => null }) }),
        };
      }

      const instance = {
        ...found,
        save: async function () {
          Object.assign(found, this);
          return found;
        },
      };

      return {
        populate: () => ({
          populate: () => ({
            populate: () => instance,
          }),
        }),
        then: (resolve) => resolve(instance),
      };
    };
  });

  after(() => {
    User.findById = originalFindById;
    Visitor.create = originalVisitorCreate;
    Visitor.find = originalVisitorFind;
    Visitor.findById = originalVisitorFindById;
  });

  it('1. owner creates visitor request -> self-approved on creation', async () => {
    const res = await request(app)
      .post('/api/visitors')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .send({
        name: 'Plumber John',
        phone: '01011112222',
        purpose: 'service',
        vehicleNumber: 'ABC 1234',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.name, 'Plumber John');
    assert.equal(res.body.status, 'approved');
    assert.equal(res.body.societyId, societyAId);
  });

  it('2. security_guard can check in approved visitor', async () => {
    const visId = inMemoryVisitors[0]._id;
    const res = await request(app)
      .patch(`/api/visitors/${visId}/check-in`)
      .set('Authorization', `Bearer ${tokenSecurityA}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'checked_in');
  });

  it('3. security_guard CANNOT check in a pending visitor (returns 400)', async () => {
    // Add pending visitor
    const pendingVis = {
      _id: 'vis_pending_1',
      societyId: societyAId,
      flatId: userOwnerA.flatId,
      name: 'Unapproved Guest',
      status: 'pending',
    };
    inMemoryVisitors.push(pendingVis);

    const res = await request(app)
      .patch('/api/visitors/vis_pending_1/check-in')
      .set('Authorization', `Bearer ${tokenSecurityA}`);

    assert.equal(res.status, 400);
    assert.match(res.body.message, /must be "approved"/);
  });

  it('4. security_guard CANNOT approve or reject a visitor (returns 403)', async () => {
    const resApprove = await request(app)
      .patch('/api/visitors/vis_pending_1/approve')
      .set('Authorization', `Bearer ${tokenSecurityA}`);

    assert.equal(resApprove.status, 403);

    const resReject = await request(app)
      .patch('/api/visitors/vis_pending_1/reject')
      .set('Authorization', `Bearer ${tokenSecurityA}`);

    assert.equal(resReject.status, 403);
  });

  it('5. tenant isolation: Society B security_guard CANNOT see Society A visitors', async () => {
    const res = await request(app)
      .get('/api/visitors')
      .set('Authorization', `Bearer ${tokenSecurityB}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.some((v) => v.societyId === societyAId), false);
  });
});
