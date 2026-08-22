import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeToTenant } from '../middleware/tenant.js';
import {
  getStateMachine,
  getComplaints,
  createComplaint,
  getComplaintById,
  assignComplaint,
  updateComplaintStatus,
  addComplaintComment,
  reopenComplaint,
} from '../controllers/complaintController.js';

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const complaintIdParam = [param('id').isMongoId().withMessage('Valid complaint id is required')];

const createComplaintValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(['maintenance', 'security', 'noise', 'cleanliness', 'other'])
    .withMessage('Valid category is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
];

const assignComplaintValidation = [
  body('assignedTo').isMongoId().withMessage('Valid assignee user id is required'),
];

const updateStatusValidation = [
  body('status')
    .isIn(['raised', 'assigned', 'in_progress', 'resolved', 'closed'])
    .withMessage('Valid status is required'),
];

const addCommentValidation = [
  body('text').trim().notEmpty().withMessage('Comment text is required'),
];

// Every route: Authentication -> Tenant scoping -> (Role check where needed) -> Controller
router.use(authenticate, scopeToTenant);

router.get('/state-machine', authorize('society_admin', 'owner', 'resident'), getStateMachine);
router.get('/', authorize('society_admin', 'owner', 'resident'), getComplaints);
router.get('/:id', authorize('society_admin', 'owner', 'resident'), complaintIdParam, validate, getComplaintById);
router.post(
  '/',
  authorize('owner', 'resident', 'society_admin'),
  createComplaintValidation,
  validate,
  createComplaint
);
router.patch(
  '/:id/assign',
  authorize('society_admin'),
  complaintIdParam,
  assignComplaintValidation,
  validate,
  assignComplaint
);
router.patch(
  '/:id/status',
  authorize('society_admin'),
  complaintIdParam,
  updateStatusValidation,
  validate,
  updateComplaintStatus
);
router.post(
  '/:id/comments',
  complaintIdParam,
  addCommentValidation,
  validate,
  addComplaintComment
);
router.post('/:id/reopen', complaintIdParam, validate, reopenComplaint);

export default router;
