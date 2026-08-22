import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canVisitorTransition } from '../../src/controllers/visitorController.js';

describe('Tier 7: Visitor Status Flow Unit Tests', () => {
  it('1. valid sequential transitions return true', () => {
    assert.equal(canVisitorTransition('pending', 'approved'), true);
    assert.equal(canVisitorTransition('pending', 'rejected'), true);
    assert.equal(canVisitorTransition('approved', 'checked_in'), true);
    assert.equal(canVisitorTransition('approved', 'rejected'), true);
    assert.equal(canVisitorTransition('checked_in', 'checked_out'), true);
  });

  it('2. invalid jumps and terminal state transitions return false', () => {
    // Cannot check in directly from pending
    assert.equal(canVisitorTransition('pending', 'checked_in'), false);
    // Cannot check out directly from approved
    assert.equal(canVisitorTransition('approved', 'checked_out'), false);
    // Checked in cannot go back to approved or pending
    assert.equal(canVisitorTransition('checked_in', 'approved'), false);
    assert.equal(canVisitorTransition('checked_in', 'pending'), false);
    // Terminal states cannot transition anywhere
    assert.equal(canVisitorTransition('checked_out', 'checked_in'), false);
    assert.equal(canVisitorTransition('rejected', 'approved'), false);
  });
});
