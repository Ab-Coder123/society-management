import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Notice from '../../src/models/Notice.js';

describe('Tier 8: Notice Module Integration Tests', () => {
  const JWT_SECRET = 'test_secret_123';
  process.env.JWT_SECRET = JWT_SECRET;

  const societyAId = '66c3a1b2c3d4e5f6a7b8c9a1';
  const societyBId = '66c3a1b2c3d4e5f6a7b8c9b2';

  const userAdminA = {
    _id: '66c3a1b2c3d4e5f6a7b8ca01',
    name: 'Admin Society A',
    email: 'adminA@society.com',
    role: 'society_admin',
    societyId: societyAId,
    isActive: true,
  };

  const userResidentA = {
    _id: '66c3a1b2c3d4e5f6a7b8ca02',
    name: 'Resident Society A',
    email: 'resA@society.com',
    role: 'resident',
    societyId: societyAId,
    isActive: true,
  };

  const userAdminB = {
    _id: '66c3a1b2c3d4e5f6a7b8cb01',
    name: 'Admin Society B',
    email: 'adminB@society.com',
    role: 'society_admin',
    societyId: societyBId,
    isActive: true,
  };

  const tokenAdminA = jwt.sign({ id: userAdminA._id, role: userAdminA.role }, JWT_SECRET);
  const tokenResidentA = jwt.sign({ id: userResidentA._id, role: userResidentA.role }, JWT_SECRET);
  const tokenAdminB = jwt.sign({ id: userAdminB._id, role: userAdminB.role }, JWT_SECRET);

  let originalFindById;
  let originalNoticeCreate;
  let originalNoticeFind;
  let originalNoticeFindById;
  let originalNoticeDelete;

  const inMemoryNotices = [];

  before(() => {
    // Stub User.findById
    originalFindById = User.findById;
    User.findById = async (id) => {
      const idStr = id?.toString();
      if (idStr === userAdminA._id) return userAdminA;
      if (idStr === userResidentA._id) return userResidentA;
      if (idStr === userAdminB._id) return userAdminB;
      return null;
    };

    // Stub Notice model operations
    originalNoticeCreate = Notice.create;
    Notice.create = async (data) => {
      const doc = {
        _id: `notice_${Date.now()}_${Math.random()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryNotices.push(doc);
      return doc;
    };

    originalNoticeFind = Notice.find;
    Notice.find = (filter) => {
      let results = inMemoryNotices.filter((n) => {
        if (filter.societyId && n.societyId.toString() !== filter.societyId.toString()) return false;
        if (filter.category && n.category !== filter.category) return false;
        if (filter.$or) {
          const now = new Date();
          const matchExpiry = !n.expiresAt || new Date(n.expiresAt) >= now;
          if (!matchExpiry) return false;
        }
        return true;
      });

      return {
        populate: () => ({
          sort: () => results,
        }),
      };
    };

    originalNoticeFindById = Notice.findById;
    Notice.findById = async (id) => {
      const found = inMemoryNotices.find((n) => n._id === id);
      if (!found) return null;
      return {
        ...found,
        save: async () => found,
        populate: () => found,
      };
    };

    originalNoticeDelete = Notice.findByIdAndDelete;
    Notice.findByIdAndDelete = async (id) => {
      const idx = inMemoryNotices.findIndex((n) => n._id === id);
      if (idx !== -1) inMemoryNotices.splice(idx, 1);
      return { _id: id };
    };
  });

  after(() => {
    User.findById = originalFindById;
    Notice.create = originalNoticeCreate;
    Notice.find = originalNoticeFind;
    Notice.findById = originalNoticeFindById;
    Notice.findByIdAndDelete = originalNoticeDelete;
  });

  it('1. society_admin can create a notice successfully and it is scoped to societyId', async () => {
    const res = await request(app)
      .post('/api/notices')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({
        title: 'Water Tank Cleaning',
        body: 'Water supply will be paused from 2pm to 5pm',
        category: 'utility',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Water Tank Cleaning');
    assert.equal(res.body.societyId, societyAId);
    assert.equal(res.body.createdBy, userAdminA._id);
  });

  it('2. resident in Society A can read Society A notices', async () => {
    const res = await request(app)
      .get('/api/notices')
      .set('Authorization', `Bearer ${tokenResidentA}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.some((n) => n.title === 'Water Tank Cleaning'));
  });

  it('3. tenant isolation: user in Society B CANNOT see notices created in Society A', async () => {
    const res = await request(app)
      .get('/api/notices')
      .set('Authorization', `Bearer ${tokenAdminB}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    // Confirm body does not leak Society A notice
    assert.equal(res.body.some((n) => n.societyId === societyAId), false);
    assert.equal(res.body.some((n) => n.title === 'Water Tank Cleaning'), false);
  });

  it('4. resident cannot create notice (returns 403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/notices')
      .set('Authorization', `Bearer ${tokenResidentA}`)
      .send({
        title: 'Unauthorized Notice',
        body: 'Test body',
      });

    assert.equal(res.status, 403);
    assert.match(res.body.message, /Forbidden/);
  });

  it('5. expired notices are excluded by default and included with ?includeExpired=true', async () => {
    // Create expired notice in memory
    inMemoryNotices.push({
      _id: 'notice_expired_1',
      title: 'Expired Meeting',
      body: 'Old meeting',
      category: 'meeting',
      societyId: societyAId,
      expiresAt: new Date('2020-01-01'),
      createdAt: new Date(),
    });

    const resDefault = await request(app)
      .get('/api/notices')
      .set('Authorization', `Bearer ${tokenResidentA}`);

    assert.equal(resDefault.status, 200);
    assert.equal(resDefault.body.some((n) => n._id === 'notice_expired_1'), false);

    const resIncluded = await request(app)
      .get('/api/notices?includeExpired=true')
      .set('Authorization', `Bearer ${tokenResidentA}`);

    assert.equal(resIncluded.status, 200);
    assert.equal(resIncluded.body.some((n) => n._id === 'notice_expired_1'), true);
  });
});
