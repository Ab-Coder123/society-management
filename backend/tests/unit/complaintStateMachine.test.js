import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPLAINT_STATUSES,
  ALLOWED_TRANSITIONS,
  getAllowedNextStates,
  canTransition,
  validateTransition,
} from '../../src/config/complaintStateMachine.js';

describe('Tier 7: Complaint State Machine Unit Tests', () => {
  it('1. should define all 5 standard complaint lifecycle statuses', () => {
    assert.deepEqual(Object.values(COMPLAINT_STATUSES), [
      'raised',
      'assigned',
      'in_progress',
      'resolved',
      'closed',
    ]);
  });

  it('2. should strictly allow valid linear transitions and return true', () => {
    assert.equal(canTransition('raised', 'assigned'), true);
    assert.equal(canTransition('assigned', 'in_progress'), true);
    assert.equal(canTransition('in_progress', 'resolved'), true);
    assert.equal(canTransition('resolved', 'closed'), true);
  });

  it('3. validateTransition should not throw on valid transitions', () => {
    assert.doesNotThrow(() => validateTransition('raised', 'assigned'));
    assert.doesNotThrow(() => validateTransition('assigned', 'in_progress'));
    assert.doesNotThrow(() => validateTransition('in_progress', 'resolved'));
    assert.doesNotThrow(() => validateTransition('resolved', 'closed'));
  });

  it('4. should reject illegal state skips and backward jumps', () => {
    // Skipping states
    assert.equal(canTransition('raised', 'in_progress'), false);
    assert.equal(canTransition('raised', 'resolved'), false);
    assert.equal(canTransition('raised', 'closed'), false);
    assert.equal(canTransition('assigned', 'resolved'), false);
    assert.equal(canTransition('assigned', 'closed'), false);

    // Backward transitions
    assert.equal(canTransition('in_progress', 'assigned'), false);
    assert.equal(canTransition('resolved', 'in_progress'), false);
    assert.equal(canTransition('closed', 'in_progress'), false);
    assert.equal(canTransition('closed', 'raised'), false);
  });

  it('5. validateTransition should throw descriptive errors with valid next states on invalid jumps', () => {
    assert.throws(
      () => validateTransition('raised', 'resolved'),
      (err) => {
        assert.match(err.message, /Invalid status transition from "raised" to "resolved"/);
        assert.match(err.message, /Allowed next status: \[assigned\]/);
        return true;
      }
    );

    assert.throws(
      () => validateTransition('closed', 'in_progress'),
      (err) => {
        assert.match(err.message, /Invalid status transition from "closed" to "in_progress"/);
        assert.match(err.message, /Allowed next status: \[none \(terminal state\)\]/);
        return true;
      }
    );
  });

  it('6. getAllowedNextStates should return exact expected arrays including for terminal and invalid states', () => {
    assert.deepEqual(getAllowedNextStates('raised'), ['assigned']);
    assert.deepEqual(getAllowedNextStates('assigned'), ['in_progress']);
    assert.deepEqual(getAllowedNextStates('in_progress'), ['resolved']);
    assert.deepEqual(getAllowedNextStates('resolved'), ['closed']);
    assert.deepEqual(getAllowedNextStates('closed'), []);
    assert.deepEqual(getAllowedNextStates('unknown_state'), []);
  });
});
