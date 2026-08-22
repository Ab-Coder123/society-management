import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Notification from '../../src/models/Notification.js';

describe('Tier 8: Notifications Integration Tests', () => {
  const JWT_SECRET = 'test_secret_123';
  process.env.JWT_SECRET = JWT_SECRET;

  const societyAId = '66c3a1b2c3d4e5f6a7b8c9a1';
  const societyBId = '66c3a1b2c3d4e5f6a7b8c9b2';

  const userA = {
    _id: '66c3a1b2c3d4e5f6a7b8ca01',
    name: 'Resident A',
    email: 'resA@society.com',
    role: 'resident',
    societyId: societyAId,
    isActive: true,
  };

  const userB = {
    _id: '66c3a1b2c3d4e5f6a7b8cb01',
    name: 'Resident B',
    email: 'resB@society.com',
    role: 'resident',
    societyId: societyBId,
    isActive: true,
  };

  const tokenUserA = jwt.sign({ id: userA._id, role: userA.role }, JWT_SECRET);
  const tokenUserB = jwt.sign({ id: userB._id, role: userB.role }, JWT_SECRET);

  let originalFindById;
  let originalNotificationFind;
  let originalNotificationCount;
  let originalNotificationFindById;
  let originalNotificationUpdateMany;

  const inMemoryNotifications = [
    {
      _id: '66c3a1b2c3d4e5f6a7b8cd01',
      societyId: societyAId,
      userId: userA._id,
      type: 'complaint_status',
      relatedId: '66c3a1b2c3d4e5f6a7b8cc01',
      message: 'Your complaint status is now in_progress',
      isRead: false,
      createdAt: new Date(),
    },
    {
      _id: '66c3a1b2c3d4e5f6a7b8cd02',
      societyId: societyAId,
      userId: userA._id,
      type: 'notice',
      relatedId: '66c3a1b2c3d4e5f6a7b8ce01',
      message: 'New announcement: Water maintenance',
      isRead: false,
      createdAt: new Date(),
    },
  ];

  before(() => {
    originalFindById = User.findById;
    User.findById = async (id) => {
      const idStr = id?.toString();
      if (idStr === userA._id) return userA;
      if (idStr === userB._id) return userB;
      return null;
    };

    originalNotificationFind = Notification.find;
    Notification.find = (filter) => {
      const filtered = inMemoryNotifications.filter((n) => {
        if (filter.societyId && n.societyId !== filter.societyId) return false;
        if (filter.userId && n.userId !== filter.userId) return false;
        if (filter.isRead !== undefined && n.isRead !== filter.isRead) return false;
        return true;
      });

      return {
        sort: () => ({
          skip: () => ({
            limit: () => filtered,
          }),
        }),
      };
    };

    originalNotificationCount = Notification.countDocuments;
    Notification.countDocuments = async (filter) => {
      return inMemoryNotifications.filter((n) => {
        if (filter.societyId && n.societyId !== filter.societyId) return false;
        if (filter.userId && n.userId !== filter.userId) return false;
        if (filter.isRead !== undefined && n.isRead !== filter.isRead) return false;
        return true;
      }).length;
    };

    originalNotificationFindById = Notification.findById;
    Notification.findById = async (id) => {
      const found = inMemoryNotifications.find((n) => n._id === id);
      if (!found) return null;
      return {
        ...found,
        save: async function () {
          Object.assign(found, this);
          return found;
        },
      };
    };

    originalNotificationUpdateMany = Notification.updateMany;
    Notification.updateMany = async (filter, update) => {
      let count = 0;
      inMemoryNotifications.forEach((n) => {
        if (n.societyId === filter.societyId && n.userId === filter.userId) {
          if (filter.isRead !== undefined && n.isRead !== filter.isRead) return;
          Object.assign(n, update.$set);
          count++;
        }
      });
      return { modifiedCount: count };
    };
  });

  after(() => {
    User.findById = originalFindById;
    Notification.find = originalNotificationFind;
    Notification.countDocuments = originalNotificationCount;
    Notification.findById = originalNotificationFindById;
    Notification.updateMany = originalNotificationUpdateMany;
  });

  it('1. GET /api/notifications returns user-scoped notifications with unread count', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tokenUserA}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.total, 2);
    assert.equal(res.body.unreadCount, 2);
    assert.equal(res.body.notifications.length, 2);
  });

  it('2. PATCH /api/notifications/:id/read marks single notification as read', async () => {
    const res = await request(app)
      .patch('/api/notifications/66c3a1b2c3d4e5f6a7b8cd01/read')
      .set('Authorization', `Bearer ${tokenUserA}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.isRead, true);

    // Other notification remains unread
    assert.equal(inMemoryNotifications[1].isRead, false);
  });

  it('3. PATCH /api/notifications/read-all marks all user notifications as read', async () => {
    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${tokenUserA}`);

    assert.equal(res.status, 200);
    assert.equal(inMemoryNotifications[0].isRead, true);
    assert.equal(inMemoryNotifications[1].isRead, true);
  });

  it('4. tenant isolation: user from Society B has 0 notifications from Society A', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tokenUserB}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.total, 0);
    assert.equal(res.body.unreadCount, 0);
    assert.deepEqual(res.body.notifications, []);
  });
});
