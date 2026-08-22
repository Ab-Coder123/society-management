import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeToTenant } from '../middleware/tenant.js';
import {
  createFlat,
  getFlats,
  getFlatOccupancySummary,
  getFlatsByBuilding,
  searchFlats,
  getFlatById,
  updateFlat,
  assignOwnerToFlat,
} from '../controllers/flatController.js';

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const flatIdParam = [param('id').isMongoId().withMessage('Valid flat id is required')];

const createFlatValidation = [
  body('building').trim().notEmpty().withMessage('Building is required'),
  body('wing').optional().trim(),
  body('flatNumber').trim().notEmpty().withMessage('Flat number is required'),
  body('occupancyStatus')
    .optional()
    .isIn(['occupied', 'vacant', 'rented'])
    .withMessage('Occupancy status must be occupied, vacant, or rented'),
];

const updateFlatValidation = [
  body('building').optional().trim().notEmpty().withMessage('Building cannot be empty'),
  body('wing').optional().trim(),
  body('flatNumber').optional().trim().notEmpty().withMessage('Flat number cannot be empty'),
  body('occupancyStatus')
    .optional()
    .isIn(['occupied', 'vacant', 'rented'])
    .withMessage('Occupancy status must be occupied, vacant, or rented'),
];

const assignOwnerValidation = [
  body('ownerId').isMongoId().withMessage('Valid owner id is required'),
];

// Every route: Authentication -> Tenant scoping -> (Role check where needed) -> Validation -> Controller
router.use(authenticate, scopeToTenant);

router.get('/occupancy-summary', authorize('society_admin', 'super_admin'), getFlatOccupancySummary);
router.get('/by-building', getFlatsByBuilding);
router.get('/search', searchFlats);
router.get('/', getFlats);
router.get('/:id', flatIdParam, validate, getFlatById);
router.post('/', authorize('society_admin'), createFlatValidation, validate, createFlat);
router.patch('/:id', authorize('society_admin'), flatIdParam, updateFlatValidation, validate, updateFlat);
router.patch('/:id/owner', authorize('society_admin'), flatIdParam, assignOwnerValidation, validate, assignOwnerToFlat);

export default router;
