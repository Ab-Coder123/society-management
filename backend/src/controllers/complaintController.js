import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { belongsToTenant } from '../middleware/tenant.js';
import {
  ALLOWED_TRANSITIONS,
  COMPLAINT_STATUSES,
  validateTransition,
} from '../config/complaintStateMachine.js';
import { createNotification } from '../utils/notify.js';

// GET /api/complaints/state-machine
export function getStateMachine(req, res) {
  res.json({
    statuses: COMPLAINT_STATUSES,
    allowedTransitions: ALLOWED_TRANSITIONS,
  });
}

// GET /api/complaints
export async function getComplaints(req, res) {
  try {
    const { status, category, priority } = req.query;
    const filter = req.societyId ? { societyId: req.societyId } : {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    // Owners and residents can optionally see only their own complaints unless society_admin
    if (['owner', 'resident'].includes(req.user.role) && req.query.myComplaints === 'true') {
      filter.raisedBy = req.user._id;
    }

    const complaints = await Complaint.find(filter)
      .populate('raisedBy', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('flatId', 'building flatNumber wing')
      .populate('comments.by', 'name role')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// POST /api/complaints
export async function createComplaint(req, res) {
  try {
    const { category, priority, title, description, flatId, attachments } = req.body;

    const complaint = await Complaint.create({
      societyId: req.societyId,
      raisedBy: req.user._id,
      flatId: flatId || req.user.flatId || null,
      category,
      priority: priority || 'medium',
      title,
      description,
      status: 'raised',
      attachments: attachments || [],
      comments: [
        {
          by: req.user._id,
          text: `Complaint raised by ${req.user.name}`,
        },
      ],
    });

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// GET /api/complaints/:id
export async function getComplaintById(req, res) {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('raisedBy', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('flatId', 'building flatNumber wing')
      .populate('comments.by', 'name role');

    if (!complaint || !belongsToTenant(complaint, req)) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// PATCH /api/complaints/:id/assign
export async function assignComplaint(req, res) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint || !belongsToTenant(complaint, req)) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const { assignedTo } = req.body;
    const assignee = await User.findById(assignedTo);
    if (!assignee || !belongsToTenant(assignee, req)) {
      return res.status(404).json({ message: 'Assignee user not found in this society' });
    }

    complaint.assignedTo = assignee._id;
    complaint.status = 'assigned';
    complaint.comments.push({
      by: req.user._id,
      text: `Status changed to assigned by ${req.user.name} (Assigned to: ${assignee.name})`,
      createdAt: new Date(),
    });

    await complaint.save();

    // Non-blocking notification to assignee
    createNotification({
      userId: assignee._id,
      societyId: req.societyId,
      type: 'complaint_assigned',
      relatedId: complaint._id,
      message: `You were assigned complaint: "${complaint.title}"`,
    });

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// PATCH /api/complaints/:id/status
export async function updateComplaintStatus(req, res) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint || !belongsToTenant(complaint, req)) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const { status } = req.body;
    try {
      validateTransition(complaint.status, status);
    } catch (transitionErr) {
      return res.status(400).json({ message: transitionErr.message });
    }

    complaint.status = status;
    complaint.comments.push({
      by: req.user._id,
      text: `Status changed to ${status} by ${req.user.name}`,
      createdAt: new Date(),
    });

    await complaint.save();

    // Notify the original raiser if updated by someone else
    if (complaint.raisedBy.toString() !== req.user._id.toString()) {
      createNotification({
        userId: complaint.raisedBy,
        societyId: req.societyId,
        type: 'complaint_status',
        relatedId: complaint._id,
        message: `Your complaint "${complaint.title}" is now ${status}`,
      });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// POST /api/complaints/:id/comments
export async function addComplaintComment(req, res) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint || !belongsToTenant(complaint, req)) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    complaint.comments.push({
      by: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    });

    await complaint.save();

    // Notify other party
    if (complaint.raisedBy.toString() !== req.user._id.toString()) {
      createNotification({
        userId: complaint.raisedBy,
        societyId: req.societyId,
        type: 'complaint_comment',
        relatedId: complaint._id,
        message: `New update on your complaint "${complaint.title}"`,
      });
    } else if (complaint.assignedTo) {
      createNotification({
        userId: complaint.assignedTo,
        societyId: req.societyId,
        type: 'complaint_comment',
        relatedId: complaint._id,
        message: `New comment on assigned complaint "${complaint.title}"`,
      });
    }

    const updated = await Complaint.findById(complaint._id).populate('comments.by', 'name role');
    res.status(201).json(updated.comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// POST /api/complaints/:id/reopen
export async function reopenComplaint(req, res) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint || !belongsToTenant(complaint, req)) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Only original raiser or society_admin can reopen
    if (
      complaint.raisedBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'society_admin'
    ) {
      return res.status(403).json({ message: 'Only the original raiser can reopen this complaint' });
    }

    if (!['resolved', 'closed'].includes(complaint.status)) {
      return res.status(400).json({
        message: `Only complaints in "resolved" or "closed" status can be reopened. Current status is "${complaint.status}"`,
      });
    }

    if (complaint.reopenCount >= 1) {
      return res.status(400).json({ message: 'Complaint has already been reopened the maximum number of times (1)' });
    }

    complaint.status = 'assigned';
    complaint.reopenCount = (complaint.reopenCount || 0) + 1;
    complaint.comments.push({
      by: req.user._id,
      text: `Complaint reopened by ${req.user.name}`,
      createdAt: new Date(),
    });

    await complaint.save();

    if (complaint.assignedTo) {
      createNotification({
        userId: complaint.assignedTo,
        societyId: req.societyId,
        type: 'complaint_status',
        relatedId: complaint._id,
        message: `Complaint reopened: "${complaint.title}"`,
      });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
