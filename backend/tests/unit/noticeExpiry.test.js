import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function buildNoticeFilter({ societyId, category, includeExpired, now = new Date() }) {
  const filter = societyId ? { societyId } : {};

  if (category) {
    filter.category = category;
  }

  if (includeExpired !== 'true') {
    filter.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gte: now } },
    ];
  }

  return filter;
}

function isNoticeExpired(notice, now = new Date()) {
  if (!notice.expiresAt) return false;
  return new Date(notice.expiresAt) < now;
}

describe('Tier 7: Notice Expiry & Filter Unit Tests', () => {
  it('1. should construct tenant and expiry filter by default', () => {
    const now = new Date('2026-08-20T12:00:00.000Z');
    const filter = buildNoticeFilter({ societyId: '66c3a1b2c3d4e5f6a7b8c9d0', includeExpired: 'false', now });

    assert.equal(filter.societyId, '66c3a1b2c3d4e5f6a7b8c9d0');
    assert.ok(Array.isArray(filter.$or));
    assert.equal(filter.$or.length, 3);
    assert.deepEqual(filter.$or[0], { expiresAt: { $exists: false } });
    assert.deepEqual(filter.$or[1], { expiresAt: null });
    assert.deepEqual(filter.$or[2], { expiresAt: { $gte: now } });
  });

  it('2. should omit $or filter when includeExpired is true', () => {
    const filter = buildNoticeFilter({ societyId: '66c3a1b2c3d4e5f6a7b8c9d0', includeExpired: 'true' });
    assert.equal(filter.societyId, '66c3a1b2c3d4e5f6a7b8c9d0');
    assert.equal(filter.$or, undefined);
  });

  it('3. should attach category filter if specified', () => {
    const filter = buildNoticeFilter({
      societyId: '66c3a1b2c3d4e5f6a7b8c9d0',
      category: 'emergency',
      includeExpired: 'true',
    });
    assert.equal(filter.category, 'emergency');
  });

  it('4. boundary checks: past, future, null, undefined, and exact match', () => {
    const now = new Date('2026-08-20T12:00:00.000Z');

    // 1 millisecond before now -> Expired
    const pastNotice = { expiresAt: new Date(now.getTime() - 1) };
    assert.equal(isNoticeExpired(pastNotice, now), true);

    // 1 millisecond after now -> Active
    const futureNotice = { expiresAt: new Date(now.getTime() + 1) };
    assert.equal(isNoticeExpired(futureNotice, now), false);

    // Exactly now -> not expired (expiresAt < now is false)
    const exactNotice = { expiresAt: new Date(now.getTime()) };
    assert.equal(isNoticeExpired(exactNotice, now), false);

    // null or missing expiresAt -> never expired
    assert.equal(isNoticeExpired({ expiresAt: null }, now), false);
    assert.equal(isNoticeExpired({}, now), false);
  });
});
