import express from 'express';
import { createStaff, getStaff, updateStaff, deactivateStaff } from '../controllers/staffController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeToTenant } from '../middleware/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(scopeToTenant);
router.use(authorize('society_admin'));

router.get('/', getStaff);
router.post('/', createStaff);
router.patch('/:id', updateStaff);
router.patch('/:id/deactivate', deactivateStaff);

export default router;
