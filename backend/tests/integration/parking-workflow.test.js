import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import ParkingSlot from '../../src/models/ParkingSlot.js';
import Visitor from '../../src/models/Visitor.js';

describe('Tier 8: Parking Workflow Integration Tests', () => {
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

  const userSecurityA = {
    _id: '66c3a1b2c3d4e5f6a7b8ca02',
    name: 'Guard A',
    email: 'guardA@society.com',
    role: 'security_guard',
    societyId: societyAId,
    isActive: true,
  };

  const tokenAdminA    = jwt.sign({ id: userAdminA._id, role: userAdminA.role }, JWT_SECRET);
  const tokenSecurityA = jwt.sign({ id: userSecurityA._id, role: userSecurityA.role }, JWT_SECRET);

  let originalFindById;
  let originalVisitorFindOne;

  before(() => {
    originalFindById = User.findById;
    User.findById = async (id) => {
      const idStr = id?.toString();
      if (idStr === userAdminA._id) return userAdminA;
      if (idStr === userSecurityA._id) return userSecurityA;
      return null;
    };

    originalVisitorFindOne = Visitor.findOne;
    Visitor.findOne = (filter) => {
      if (filter.vehicleNumber && filter.vehicleNumber.$regex) {
        const queryStr = filter.vehicleNumber.$regex.source.replace('^', '').replace('$', '');
        if (queryStr.toUpperCase() === 'APPROVED 123') {
          const matchDoc = {
            _id: 'vis_app_1',
            societyId: societyAId,
            name: 'Courier Bob',
            purpose: 'delivery',
            status: 'approved',
            vehicleNumber: 'APPROVED 123',
            flatId: { building: 'A', flatNumber: '101' },
          };
          return {
            populate: () => matchDoc,
          };
        }
      }
      return {
        populate: () => null,
      };
    };
  });

  after(() => {
    User.findById = originalFindById;
    Visitor.findOne = originalVisitorFindOne;
  });

  it('1. verifyVisitorVehicle by security_guard returns match for approved visitor vehicle', async () => {
    const res = await request(app)
      .get('/api/parking/verify-vehicle?vehicleNumber=APPROVED 123')
      .set('Authorization', `Bearer ${tokenSecurityA}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.matched, true);
    assert.equal(res.body.visitor.name, 'Courier Bob');
  });

  it('2. verifyVisitorVehicle returns matched=false for unknown vehicle number', async () => {
    const res = await request(app)
      .get('/api/parking/verify-vehicle?vehicleNumber=UNKNOWN 999')
      .set('Authorization', `Bearer ${tokenSecurityA}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.matched, false);
    assert.match(res.body.message, /No approved visitor found/);
  });
});
