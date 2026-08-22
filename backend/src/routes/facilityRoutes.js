import express from 'express';
import { createBooking, getBookings, approveBooking, rejectBooking, cancelBooking } from '../controllers/facilityController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeToTenant } from '../middleware/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(scopeToTenant);

router.get('/', authorize('society_admin', 'owner', 'resident'), getBookings);
router.post('/', authorize('owner', 'resident', 'society_admin'), createBooking);
router.patch('/:id/approve', authorize('society_admin'), approveBooking);
router.patch('/:id/reject', authorize('society_admin'), rejectBooking);
router.patch('/:id/cancel', authorize('owner', 'resident', 'society_admin'), cancelBooking);

export default router;
