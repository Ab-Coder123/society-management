import express from 'express';
import { param, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { scopeToTenant } from '../middleware/tenant.js';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const notificationIdParam = [
  param('id').isMongoId().withMessage('Valid notification id is required'),
];

router.use(authenticate, scopeToTenant);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', notificationIdParam, validate, markAsRead);

export default router;
