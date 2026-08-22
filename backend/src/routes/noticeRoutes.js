import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeToTenant } from '../middleware/tenant.js';
import {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} from '../controllers/noticeController.js';

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const noticeIdParam = [param('id').isMongoId().withMessage('Valid notice id is required')];

const createNoticeValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('body').trim().notEmpty().withMessage('Body is required'),
  body('category')
    .optional()
    .isIn(['maintenance', 'meeting', 'utility', 'emergency', 'holiday', 'general'])
    .withMessage('Invalid category'),
  body('expiresAt')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('expiresAt must be a valid date'),
];

const updateNoticeValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('body').optional().trim().notEmpty().withMessage('Body cannot be empty'),
  body('category')
    .optional()
    .isIn(['maintenance', 'meeting', 'utility', 'emergency', 'holiday', 'general'])
    .withMessage('Invalid category'),
  body('expiresAt')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('expiresAt must be a valid date'),
];

// Middleware chain: authenticate -> scopeToTenant
router.use(authenticate, scopeToTenant);

router.get('/', getNotices);
router.get('/:id', noticeIdParam, validate, getNoticeById);
router.post('/', authorize('society_admin'), createNoticeValidation, validate, createNotice);
router.patch('/:id', authorize('society_admin'), noticeIdParam, updateNoticeValidation, validate, updateNotice);
router.delete('/:id', authorize('society_admin'), noticeIdParam, validate, deleteNotice);

export default router;
