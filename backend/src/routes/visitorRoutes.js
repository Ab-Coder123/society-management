import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeToTenant } from '../middleware/tenant.js';
import {
  createVisitorRequest,
  getVisitors,
  getVisitorById,
  approveVisitor,
  rejectVisitor,
  checkInVisitor,
  checkOutVisitor,
  getVisitorHistory,
} from '../controllers/visitorController.js';

const router = express.Router();

// All routes require authentication + tenant scoping
router.use(authenticate, scopeToTenant);

// ── Collection routes ─────────────────────────────────────────────────────────

// GET  /api/visitors          — scoped by role (admin=all, security=today+pending, owner/resident=own flat)
// POST /api/visitors          — owner/resident pre-registers expected visitor
router
  .route('/')
  .get(
    authorize('society_admin', 'security_guard', 'owner', 'resident'),
    getVisitors
  )
  .post(
    authorize('owner', 'resident', 'society_admin'),
    createVisitorRequest
  );

// GET /api/visitors/history   — paginated history for admin + security guard
router.get(
  '/history',
  authorize('society_admin', 'security_guard'),
  getVisitorHistory
);

// ── Item routes ───────────────────────────────────────────────────────────────

router.get(
  '/:id',
  authorize('society_admin', 'security_guard', 'owner', 'resident'),
  getVisitorById
);

// PATCH /api/visitors/:id/approve  — flat owner/resident only (verified inside controller)
router.patch(
  '/:id/approve',
  authorize('owner', 'resident', 'society_admin'),
  approveVisitor
);

// PATCH /api/visitors/:id/reject
router.patch(
  '/:id/reject',
  authorize('owner', 'resident', 'society_admin'),
  rejectVisitor
);

// PATCH /api/visitors/:id/check-in   — security_guard ONLY
router.patch(
  '/:id/check-in',
  authorize('security_guard'),
  checkInVisitor
);

// PATCH /api/visitors/:id/check-out  — security_guard ONLY
router.patch(
  '/:id/check-out',
  authorize('security_guard'),
  checkOutVisitor
);

export default router;
