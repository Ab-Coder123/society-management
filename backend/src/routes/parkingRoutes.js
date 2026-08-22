import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeToTenant } from '../middleware/tenant.js';
import {
  createParkingSlots,
  getParkingSlots,
  allocateSlot,
  deallocateSlot,
  verifyVisitorVehicle,
} from '../controllers/parkingController.js';

const router = express.Router();

router.use(authenticate, scopeToTenant);

// GET  /api/parking/slots        — admin (full), owner/resident (sanitized, no other flats' vehicle numbers)
// POST /api/parking/slots/bulk   — admin only: bulk create
router.get(
  '/slots',
  authorize('society_admin', 'owner', 'resident'),
  getParkingSlots
);

router.post(
  '/slots/bulk',
  authorize('society_admin'),
  createParkingSlots
);

// PATCH /api/parking/slots/:id/allocate    — admin only
router.patch(
  '/slots/:id/allocate',
  authorize('society_admin'),
  allocateSlot
);

// PATCH /api/parking/slots/:id/deallocate  — admin only
router.patch(
  '/slots/:id/deallocate',
  authorize('society_admin'),
  deallocateSlot
);

// GET /api/parking/verify-vehicle?vehicleNumber=XYZ  — security_guard only
// Checks against Visitor records ONLY — does NOT expose resident vehicle data
router.get(
  '/verify-vehicle',
  authorize('security_guard'),
  verifyVisitorVehicle
);

export default router;
