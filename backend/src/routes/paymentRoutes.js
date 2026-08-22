import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeToTenant } from '../middleware/tenant.js';
import {
  createCharge,
  getPayments,
  markAsPaid,
  getOverduePayments,
  getPaymentSummary,
} from '../controllers/paymentController.js';

const router = express.Router();

// All routes: authenticate + tenant scope
// CRITICAL: security_guard is explicitly NOT listed in any authorize() call below.
// This is not accidental omission — it is a deliberate hard exclusion.
router.use(authenticate, scopeToTenant);

// GET  /api/payments          — admin (all, filterable) | owner (own flat only)
// POST /api/payments          — admin only: single or bulk charge creation
router
  .route('/')
  .get(authorize('society_admin', 'owner'), getPayments)
  .post(authorize('society_admin'), createCharge);

// GET /api/payments/summary   — admin only: aggregation summary for a month
router.get('/summary', authorize('society_admin'), getPaymentSummary);

// GET /api/payments/overdue   — admin only: overdue pending payments
router.get('/overdue', authorize('society_admin'), getOverduePayments);

// PATCH /api/payments/:id/mark-paid  — admin only
router.patch('/:id/mark-paid', authorize('society_admin'), markAsPaid);

export default router;
