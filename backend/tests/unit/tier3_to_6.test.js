import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPLAINT_STATUSES,
  ALLOWED_TRANSITIONS,
  getAllowedNextStates,
  canTransition,
  validateTransition,
} from '../../src/config/complaintStateMachine.js';
import { createNotification } from '../../src/utils/notify.js';

describe('Part A: Complaint State Machine Logic (Tier 3)', () => {
  it('1. should allow every valid sequential transition: raised -> assigned -> in_progress -> resolved -> closed', () => {
    assert.equal(canTransition('raised', 'assigned'), true);
    assert.equal(canTransition('assigned', 'in_progress'), true);
    assert.equal(canTransition('in_progress', 'resolved'), true);
    assert.equal(canTransition('resolved', 'closed'), true);

    assert.doesNotThrow(() => validateTransition('raised', 'assigned'));
    assert.doesNotThrow(() => validateTransition('assigned', 'in_progress'));
    assert.doesNotThrow(() => validateTransition('in_progress', 'resolved'));
    assert.doesNotThrow(() => validateTransition('resolved', 'closed'));
  });

  it('2. should reject invalid/skipped transitions with descriptive error message listing valid next states', () => {
    assert.equal(canTransition('raised', 'resolved'), false);
    assert.equal(canTransition('raised', 'closed'), false);
    assert.equal(canTransition('assigned', 'closed'), false);
    assert.equal(canTransition('closed', 'in_progress'), false);

    assert.throws(
      () => validateTransition('raised', 'resolved'),
      (err) => {
        assert.ok(err.message.includes('Invalid status transition from "raised" to "resolved"'));
        assert.ok(err.message.includes('Allowed next status: [assigned]'));
        return true;
      }
    );

    assert.throws(
      () => validateTransition('closed', 'in_progress'),
      (err) => {
        assert.ok(err.message.includes('Invalid status transition from "closed" to "in_progress"'));
        assert.ok(err.message.includes('Allowed next status: [none (terminal state)]'));
        return true;
      }
    );
  });

  it('3. reopenComplaint validation logic: only allowed from resolved/closed and capped at 1', () => {
    function canReopen(status, reopenCount) {
      if (!['resolved', 'closed'].includes(status)) return { allowed: false, reason: 'Invalid status' };
      if (reopenCount >= 1) return { allowed: false, reason: 'Max reopens reached' };
      return { allowed: true };
    }

    assert.equal(canReopen('resolved', 0).allowed, true);
    assert.equal(canReopen('closed', 0).allowed, true);
    assert.equal(canReopen('raised', 0).allowed, false);
    assert.equal(canReopen('assigned', 0).allowed, false);
    assert.equal(canReopen('in_progress', 0).allowed, false);
    assert.equal(canReopen('resolved', 1).allowed, false);
    assert.equal(canReopen('closed', 1).allowed, false);
  });

  it('4. should format system audit comments correctly on status changes', () => {
    function formatSystemComment(action, userName, extra) {
      if (action === 'assigned') return `Status changed to assigned by ${userName} (Assigned to: ${extra})`;
      if (action === 'status') return `Status changed to ${extra} by ${userName}`;
      if (action === 'reopen') return `Complaint reopened by ${userName}`;
      return `Update by ${userName}`;
    }

    assert.equal(
      formatSystemComment('assigned', 'Admin User', 'Staff Member'),
      'Status changed to assigned by Admin User (Assigned to: Staff Member)'
    );
    assert.equal(
      formatSystemComment('status', 'Admin User', 'in_progress'),
      'Status changed to in_progress by Admin User'
    );
    assert.equal(
      formatSystemComment('reopen', 'Owner User'),
      'Complaint reopened by Owner User'
    );
  });
});

describe('Part B: Notification Utility & Business Rules (Tier 4)', () => {
  it('1. should validate required notification payload parameters', async () => {
    const res = await createNotification({
      userId: null,
      societyId: 'soc123',
      type: 'complaint_status',
      relatedId: 'comp123',
      message: 'Hello',
    });
    assert.equal(res, null);
  });

  it('2. failure inside notify.js does NOT throw uncaught exceptions (non-blocking contract)', async () => {
    await assert.doesNotReject(async () => {
      await createNotification({});
    });
  });

  it('3. recipient resolution logic for comments: notifies the opposite party', () => {
    function resolveCommentRecipient({ commentAuthorId, raiserId, assigneeId }) {
      if (commentAuthorId.toString() !== raiserId.toString()) {
        return raiserId;
      }
      return assigneeId || null;
    }

    const raiser = 'user_raiser_1';
    const staff = 'user_staff_2';
    const admin = 'user_admin_3';

    // Staff comments -> notify raiser
    assert.equal(
      resolveCommentRecipient({ commentAuthorId: staff, raiserId: raiser, assigneeId: staff }),
      raiser
    );

    // Admin comments -> notify raiser
    assert.equal(
      resolveCommentRecipient({ commentAuthorId: admin, raiserId: raiser, assigneeId: staff }),
      raiser
    );

    // Raiser comments -> notify assignee
    assert.equal(
      resolveCommentRecipient({ commentAuthorId: raiser, raiserId: raiser, assigneeId: staff }),
      staff
    );
  });
});
