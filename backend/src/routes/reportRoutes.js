import express from 'express';
import { getOccupancyReport, getPaymentReport, getComplaintReport, getVisitorReport } from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeToTenant } from '../middleware/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(scopeToTenant);
router.use(authorize('society_admin'));

router.get('/occupancy', getOccupancyReport);
router.get('/payments', getPaymentReport);
router.get('/complaints', getComplaintReport);
router.get('/visitors', getVisitorReport);

export default router;
