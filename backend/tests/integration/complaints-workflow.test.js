import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Complaint from '../../src/models/Complaint.js';

describe('Tier 8: Complaints Workflow Integration Tests', () => {
  const JWT_SECRET = 'test_secret_123';
  process.env.JWT_SECRET = JWT_SECRET;

  const societyAId = '66c3a1b2c3d4e5f6a7b8c9a1';
  const societyBId = '66c3a1b2c3d4e5f6a7b8c9b2';

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

  const userStaffA = {
    _id: '66c3a1b2c3d4e5f6a7b8ca03',
    name: 'Staff Plumber A',
    email: 'plumber@society.com',
    role: 'security_guard',
    societyId: societyAId,
    isActive: true,
  };

  const userAdminB = {
    _id: '66c3a1b2c3d4e5f6a7b8cb01',
    name: 'Admin B',
    email: 'adminB@society.com',
    role: 'society_admin',
    societyId: societyBId,
    isActive: true,
  };

  const tokenAdminA = jwt.sign({ id: userAdminA._id, role: userAdminA.role }, JWT_SECRET);
  const tokenOwnerA = jwt.sign({ id: userOwnerA._id, role: userOwnerA.role }, JWT_SECRET);
  const tokenAdminB = jwt.sign({ id: userAdminB._id, role: userAdminB.role }, JWT_SECRET);

  let originalFindById;
  let originalComplaintCreate;
  let originalComplaintFind;
  let originalComplaintFindById;

  const inMemoryComplaints = [];

  before(() => {
    originalFindById = User.findById;
    User.findById = async (id) => {
      const idStr = id?.toString();
      if (idStr === userAdminA._id) return userAdminA;
      if (idStr === userOwnerA._id) return userOwnerA;
      if (idStr === userStaffA._id) return userStaffA;
      if (idStr === userAdminB._id) return userAdminB;
      return null;
    };

    originalComplaintCreate = Complaint.create;
    Complaint.create = async (data) => {
      const doc = {
        _id: '66c3a1b2c3d4e5f6a7b8cc01',
        ...data,
        status: data.status || 'raised',
        reopenCount: 0,
        comments: data.comments || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryComplaints.push(doc);
      return doc;
    };

    originalComplaintFindById = Complaint.findById;
    Complaint.findById = (id) => {
      const found = inMemoryComplaints.find((c) => c._id === id);
      if (!found) {
        return {
          populate: () => ({ populate: () => ({ populate: () => ({ populate: () => null }) }) }),
        };
      }

      const instance = {
        ...found,
        save: async function () {
          Object.assign(found, this);
          return found;
        },
        populate: function () {
          return this;
        },
      };

      return {
        populate: () => ({
          populate: () => ({
            populate: () => ({
              populate: () => instance,
            }),
          }),
        }),
        then: (resolve) => resolve(instance),
      };
    };
  });

  after(() => {
    User.findById = originalFindById;
    Complaint.create = originalComplaintCreate;
    Complaint.findById = originalComplaintFindById;
  });

  it('1. owner raises a complaint -> status starts as raised', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .send({
        title: 'Pipe Leakage in Kitchen',
        description: 'Water is dripping from under the sink',
        category: 'maintenance',
        priority: 'high',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Pipe Leakage in Kitchen');
    assert.equal(res.body.status, 'raised');
    assert.equal(res.body.societyId, societyAId);
  });

  it('2. society_admin assigns complaint to staff -> moves to assigned', async () => {
    const res = await request(app)
      .patch('/api/complaints/66c3a1b2c3d4e5f6a7b8cc01/assign')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({ assignedTo: userStaffA._id });

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'assigned');
    assert.equal(res.body.assignedTo, userStaffA._id);
    assert.ok(res.body.comments.some((c) => c.text.includes('Status changed to assigned')));
  });

  it('3. invalid transition attempt (assigned -> closed) is rejected with 400', async () => {
    const res = await request(app)
      .patch('/api/complaints/66c3a1b2c3d4e5f6a7b8cc01/status')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({ status: 'closed' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Invalid status transition from "assigned" to "closed"/);
    assert.match(res.body.message, /Allowed next status: \[in_progress\]/);
  });

  it('4. sequential progress: assigned -> in_progress -> resolved', async () => {
    const res1 = await request(app)
      .patch('/api/complaints/66c3a1b2c3d4e5f6a7b8cc01/status')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({ status: 'in_progress' });
    assert.equal(res1.status, 200);
    assert.equal(res1.body.status, 'in_progress');

    const res2 = await request(app)
      .patch('/api/complaints/66c3a1b2c3d4e5f6a7b8cc01/status')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({ status: 'resolved' });
    assert.equal(res2.status, 200);
    assert.equal(res2.body.status, 'resolved');
  });

  it('5. reopen complaint: raiser can reopen resolved complaint once; second attempt fails', async () => {
    // First reopen -> Succeeds (status becomes assigned, reopenCount = 1)
    const reopen1 = await request(app)
      .post('/api/complaints/66c3a1b2c3d4e5f6a7b8cc01/reopen')
      .set('Authorization', `Bearer ${tokenOwnerA}`);

    assert.equal(reopen1.status, 200);
    assert.equal(reopen1.body.status, 'assigned');
    assert.equal(reopen1.body.reopenCount, 1);

    // Resolve again
    inMemoryComplaints[0].status = 'resolved';

    // Second reopen -> Fails with 400
    const reopen2 = await request(app)
      .post('/api/complaints/66c3a1b2c3d4e5f6a7b8cc01/reopen')
      .set('Authorization', `Bearer ${tokenOwnerA}`);

    assert.equal(reopen2.status, 400);
    assert.match(reopen2.body.message, /maximum number of times/);
  });

  it('6. tenant isolation: user in Society B cannot view Society A complaint (404 and no leaked data)', async () => {
    const res = await request(app)
      .get('/api/complaints/66c3a1b2c3d4e5f6a7b8cc01')
      .set('Authorization', `Bearer ${tokenAdminB}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.message, 'Complaint not found');
    assert.equal(res.body.title, undefined);
  });
});
