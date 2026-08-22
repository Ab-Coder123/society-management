import Notice from '../models/Notice.js';
import { belongsToTenant } from '../middleware/tenant.js';

// POST /api/notices
export async function createNotice(req, res) {
  try {
    const { title, body, category, expiresAt } = req.body;

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(400).json({ message: 'expiresAt cannot be in the past' });
    }

    const notice = await Notice.create({
      title,
      body,
      category: category || 'general',
      expiresAt: expiresAt || null,
      societyId: req.societyId,
      createdBy: req.user._id,
    });

    res.status(201).json(notice);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// GET /api/notices
export async function getNotices(req, res) {
  try {
    const { category, includeExpired } = req.query;
    const filter = req.societyId ? { societyId: req.societyId } : {};

    if (category) {
      filter.category = category;
    }

    if (includeExpired !== 'true') {
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } },
      ];
    }

    const notices = await Notice.find(filter)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// GET /api/notices/:id
export async function getNoticeById(req, res) {
  try {
    const notice = await Notice.findById(req.params.id).populate('createdBy', 'name role');
    if (!notice || !belongsToTenant(notice, req)) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    res.json(notice);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// PATCH /api/notices/:id
export async function updateNotice(req, res) {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice || !belongsToTenant(notice, req)) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    const { title, body, category, expiresAt } = req.body;

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(400).json({ message: 'expiresAt cannot be in the past' });
    }

    if (title !== undefined) notice.title = title;
    if (body !== undefined) notice.body = body;
    if (category !== undefined) notice.category = category;
    if (expiresAt !== undefined) notice.expiresAt = expiresAt;

    await notice.save();
    res.json(notice);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// DELETE /api/notices/:id
export async function deleteNotice(req, res) {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice || !belongsToTenant(notice, req)) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
