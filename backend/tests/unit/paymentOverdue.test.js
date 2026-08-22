import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isOverdue } from '../../src/controllers/paymentController.js';

describe('Tier 7: Payment Overdue Computation Unit Tests', () => {
  it('1. pending payment past the month end date is overdue', () => {
    const month = '2026-07'; // July 2026 ended July 31 23:59:59.999
    const now = new Date('2026-08-01T00:00:00.000Z');
    assert.equal(isOverdue(month, 'pending', now), true);
  });

  it('2. pending payment during the active month is NOT overdue', () => {
    const month = '2026-08';
    const now = new Date('2026-08-15T12:00:00.000Z');
    assert.equal(isOverdue(month, 'pending', now), false);
  });

  it('3. future month pending payment is NEVER overdue', () => {
    const month = '2026-12';
    const now = new Date('2026-08-20T12:00:00.000Z');
    assert.equal(isOverdue(month, 'pending', now), false);
  });

  it('4. paid payments are NEVER overdue regardless of date', () => {
    const month = '2020-01';
    const now = new Date('2026-08-20T12:00:00.000Z');
    assert.equal(isOverdue(month, 'paid', now), false);
  });

  it('5. exact boundary: last millisecond of the month is NOT overdue, 1ms after IS overdue', () => {
    const month = '2026-08';
    // Last millisecond of August (months in JS Date constructor are 0-indexed: 8=September, day 0 = August 31)
    const exactLastMs = new Date(2026, 8, 0, 23, 59, 59, 999);
    assert.equal(isOverdue(month, 'pending', exactLastMs), false);

    const oneMsAfter = new Date(exactLastMs.getTime() + 1);
    assert.equal(isOverdue(month, 'pending', oneMsAfter), true);
  });
});
