import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeToTenant } from '../middleware/tenant.js';
import {
  createSociety,
  getSocieties,
  getSocietyStats,
  getSocietyById,
  updateSociety,
  deactivateSociety,
} from '../controllers/societyController.js';

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const societyIdParam = [param('id').isMongoId().withMessage('Valid society id is required')];

const createSocietyValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('totalFlats').optional().isInt({ min: 0 }).withMessage('Total flats must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const updateSocietyValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('totalFlats').optional().isInt({ min: 0 }).withMessage('Total flats must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

// Every route: Authentication -> Tenant scoping -> (Role check where needed) -> Validation -> Controller
router.use(authenticate, scopeToTenant);

router.get('/stats', authorize('super_admin'), getSocietyStats);
router.get('/', getSocieties);
router.get('/:id', societyIdParam, validate, getSocietyById);
router.post('/', authorize('super_admin'), createSocietyValidation, validate, createSociety);
router.patch('/:id', authorize('super_admin'), societyIdParam, updateSocietyValidation, validate, updateSociety);
router.delete('/:id', authorize('super_admin'), societyIdParam, validate, deactivateSociety);

export default router;
