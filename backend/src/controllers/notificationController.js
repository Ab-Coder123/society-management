import Notification from '../models/Notification.js';
import { belongsToTenant } from '../middleware/tenant.js';

// GET /api/notifications
export async function getMyNotifications(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      userId: req.user._id,
      societyId: req.societyId,
    };

    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
    ]);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      societyId: req.societyId,
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// PATCH /api/notifications/:id/read
export async function markAsRead(req, res) {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification || !belongsToTenant(notification, req)) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// PATCH /api/notifications/read-all
export async function markAllAsRead(req, res) {
  try {
    await Notification.updateMany(
      {
        userId: req.user._id,
        societyId: req.societyId,
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
