import express from 'express';
import { createEvent, getEvents, updateEvent, deleteEvent, rsvpToEvent } from '../controllers/eventController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeToTenant } from '../middleware/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(scopeToTenant);

router.get('/', getEvents); // All roles
router.post('/', authorize('society_admin'), createEvent);
router.patch('/:id', authorize('society_admin'), updateEvent);
router.delete('/:id', authorize('society_admin'), deleteEvent);
router.post('/:id/rsvp', authorize('owner', 'resident'), rsvpToEvent);

export default router;
