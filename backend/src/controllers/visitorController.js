import Visitor from '../models/Visitor.js';
import { belongsToTenant } from '../middleware/tenant.js';
import { whatsapp } from '../utils/whatsapp.js';

// ─── Visitor Status Transition Rules ──────────────────────────────────────────
// pending   → approved | rejected
// approved  → checked_in | rejected
// checked_in → checked_out
// rejected  → (terminal)
// checked_out → (terminal)
const VISITOR_TRANSITIONS = {
  pending:    ['approved', 'rejected'],
  approved:   ['checked_in', 'rejected'],
  checked_in: ['checked_out'],
  rejected:   [],
  checked_out:[],
};

export function canVisitorTransition(from, to) {
  return (VISITOR_TRANSITIONS[from] || []).includes(to);
}

// ─── Helper: restrict security_guard populate to non-personal fields ──────────
const SECURITY_POPULATE_FIELDS = 'name phone';   // ONLY these — no email, role, flat address etc.
const FULL_POPULATE_FIELDS     = 'name email phone role';

// ─── POST /api/visitors ───────────────────────────────────────────────────────
// Owner / Resident pre-registers an expected visitor for their flat.
export async function createVisitorRequest(req, res) {
  try {
    const { name, phone, purpose, vehicleNumber, flatId } = req.body;

    // The visitor is scoped to the caller's own flatId (from their JWT profile)
    // unless society_admin is creating on behalf of a flat (specifying flatId explicitly)
    const visitorFlatId = req.user.flatId || flatId || null;

    if (!visitorFlatId && req.user.role !== 'society_admin') {
      return res.status(400).json({ message: 'Your account is not linked to a flat. Contact your society admin.' });
    }

    // Resident/owner can self-approve on creation (they know the visitor is coming)
    const selfApprove = ['owner', 'resident'].includes(req.user.role);

    const visitor = await Visitor.create({
      societyId: req.societyId,
      flatId:    visitorFlatId,
      name:      name?.trim(),
      phone:     phone?.trim(),
      purpose:   purpose || 'guest',
      vehicleNumber: vehicleNumber?.trim() || null,
      status:    selfApprove ? 'approved' : 'pending',
      approvedBy: selfApprove ? req.user._id : null,
    });

    res.status(201).json(visitor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── GET /api/visitors ────────────────────────────────────────────────────────
// society_admin: sees all in society
// security_guard: sees today + pending only (no extra personal data)
// owner/resident: sees only their own flat's visitors
export async function getVisitors(req, res) {
  try {
    const { status, flatId, date } = req.query;
    const filter = { societyId: req.societyId };

    if (status) filter.status = status;

    const role = req.user.role;

    if (role === 'security_guard') {
      // Today's visitors + any pending (need clearance)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      filter.$or = [
        { status: 'pending' },
        { status: 'approved' },
        { checkInTime: { $gte: startOfDay, $lte: endOfDay } },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } },
      ];
    } else if (['owner', 'resident'].includes(role)) {
      // Only their flat
      filter.flatId = req.user.flatId;
    } else if (role === 'society_admin') {
      // Optional filters for admin
      if (flatId) filter.flatId = flatId;
      if (date) {
        const d = new Date(date);
        const start = new Date(d.setHours(0, 0, 0, 0));
        const end   = new Date(d.setHours(23, 59, 59, 999));
        filter.createdAt = { $gte: start, $lte: end };
      }
    }

    // Security guard gets a restricted field set — no leaking resident personal data
    const userPopulateFields = role === 'security_guard' ? SECURITY_POPULATE_FIELDS : FULL_POPULATE_FIELDS;

    const visitors = await Visitor.find(filter)
      .populate('flatId', 'building flatNumber wing')
      .populate('approvedBy', userPopulateFields)
      .populate('loggedBySecurity', userPopulateFields)
      .sort({ createdAt: -1 });

    res.json(visitors);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── GET /api/visitors/:id ────────────────────────────────────────────────────
export async function getVisitorById(req, res) {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('flatId', 'building flatNumber wing')
      .populate('approvedBy', FULL_POPULATE_FIELDS)
      .populate('loggedBySecurity', FULL_POPULATE_FIELDS);

    if (!visitor || !belongsToTenant(visitor, req)) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Owner/resident: only their flat
    if (['owner', 'resident'].includes(req.user.role)) {
      if (visitor.flatId._id.toString() !== req.user.flatId?.toString()) {
        return res.status(404).json({ message: 'Visitor not found' });
      }
    }

    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── PATCH /api/visitors/:id/approve ─────────────────────────────────────────
// Owner / Resident of the RELEVANT flat only
export async function approveVisitor(req, res) {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor || !belongsToTenant(visitor, req)) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Flat ownership check — you can only approve visitors for YOUR flat
    if (
      req.user.role !== 'society_admin' &&
      visitor.flatId.toString() !== req.user.flatId?.toString()
    ) {
      return res.status(403).json({ message: 'You can only approve visitors for your own flat' });
    }

    if (!canVisitorTransition(visitor.status, 'approved')) {
      return res.status(400).json({
        message: `Cannot approve a visitor with status "${visitor.status}". Only "pending" visitors can be approved.`,
      });
    }

    visitor.status     = 'approved';
    visitor.approvedBy = req.user._id;
    await visitor.save();

    // Fire WhatsApp notification non-blockingly (mock in test/dev mode)
    // Notify the resident that their visitor was approved
    const populatedVisitor = await Visitor.findById(visitor._id).populate('flatId', 'building flatNumber wing');
    if (populatedVisitor?.flatId) {
      const flatLabel = `${populatedVisitor.flatId.building}-${populatedVisitor.flatId.flatNumber}`;
      // Fire and forget — never await notification in request path
      whatsapp.visitorApproved(visitor.phone || '', visitor.name, flatLabel).catch(() => {});
    }

    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── PATCH /api/visitors/:id/reject ──────────────────────────────────────────
export async function rejectVisitor(req, res) {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor || !belongsToTenant(visitor, req)) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    if (
      req.user.role !== 'society_admin' &&
      visitor.flatId.toString() !== req.user.flatId?.toString()
    ) {
      return res.status(403).json({ message: 'You can only reject visitors for your own flat' });
    }

    if (!canVisitorTransition(visitor.status, 'rejected')) {
      return res.status(400).json({
        message: `Cannot reject a visitor with status "${visitor.status}".`,
      });
    }

    visitor.status = 'rejected';
    await visitor.save();

    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── PATCH /api/visitors/:id/check-in ────────────────────────────────────────
// security_guard ONLY — requires status = 'approved'
export async function checkInVisitor(req, res) {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor || !belongsToTenant(visitor, req)) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Hard enforcement — not just a suggestion
    if (visitor.status !== 'approved') {
      return res.status(400).json({
        message: `Cannot check in visitor with status "${visitor.status}". Visitor must be "approved" by the flat owner/resident first before check-in is allowed.`,
      });
    }

    visitor.status           = 'checked_in';
    visitor.checkInTime      = new Date();
    visitor.loggedBySecurity = req.user._id;
    await visitor.save();

    // Fire WhatsApp notification non-blockingly — alert the resident
    const checkInTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    whatsapp.visitorCheckedIn(visitor.phone || '', visitor.name, checkInTime).catch(() => {});

    // Return only the fields security guard needs — no personal resident data
    const result = await Visitor.findById(visitor._id)
      .populate('flatId', 'building flatNumber wing')
      .populate('approvedBy', SECURITY_POPULATE_FIELDS)
      .populate('loggedBySecurity', SECURITY_POPULATE_FIELDS);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── PATCH /api/visitors/:id/check-out ───────────────────────────────────────
// security_guard ONLY
export async function checkOutVisitor(req, res) {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor || !belongsToTenant(visitor, req)) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    if (visitor.status !== 'checked_in') {
      return res.status(400).json({
        message: `Cannot check out visitor with status "${visitor.status}". Visitor must be checked in first.`,
      });
    }

    visitor.status       = 'checked_out';
    visitor.checkOutTime = new Date();
    await visitor.save();

    const result = await Visitor.findById(visitor._id)
      .populate('flatId', 'building flatNumber wing')
      .populate('approvedBy', SECURITY_POPULATE_FIELDS)
      .populate('loggedBySecurity', SECURITY_POPULATE_FIELDS);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── GET /api/visitors/history ────────────────────────────────────────────────
// society_admin + security_guard — paginated, filterable by date range
export async function getVisitorHistory(req, res) {
  try {
    const { from, to, page = 1, limit = 20, status } = req.query;
    const filter = { societyId: req.societyId };

    if (status) filter.status = status;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Visitor.countDocuments(filter);

    // Security guard: restricted populate — no resident personal data beyond name/phone
    const userFields = req.user.role === 'security_guard' ? SECURITY_POPULATE_FIELDS : FULL_POPULATE_FIELDS;

    const visitors = await Visitor.find(filter)
      .populate('flatId', 'building flatNumber wing')
      .populate('approvedBy', userFields)
      .populate('loggedBySecurity', userFields)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      visitors,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
