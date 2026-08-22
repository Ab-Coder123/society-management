import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

/**
 * Creates an in-app database notification non-blockingly.
 *
 * The function guards against two failure modes:
 *  1. Missing parameters — logs a warning and returns null immediately.
 *  2. DB not ready (buffering timeout, connection not established in test env) —
 *     caught by the outer try/catch. Does NOT throw, so callers are never blocked.
 */
export async function createNotification({ userId, societyId, type, relatedId, message }) {
  try {
    if (!userId || !societyId || !type || !relatedId || !message) {
      console.warn('⚠️ createNotification missing required parameters');
      return null;
    }

    // Guard: if the DB connection is not yet open or is in a non-connected state,
    // skip the insert entirely to prevent buffering timeout spam in test environments.
    // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    if (mongoose.connection.readyState !== 1) {
      return null;
    }

    const notification = await Notification.create({
      userId,
      societyId,
      type,
      relatedId,
      message,
    });

    return notification;
  } catch (err) {
    // Non-blocking: catch all errors (including buffering timeouts) silently.
    // Log only in non-test environments to avoid noisy test output.
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ Failed to create notification:', err.message);
    }
    return null;
  }
}
