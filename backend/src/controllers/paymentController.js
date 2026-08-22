import Payment from '../models/Payment.js';
import Flat from '../models/Flat.js';
import { belongsToTenant } from '../middleware/tenant.js';
import { whatsapp } from '../utils/whatsapp.js';

// ─── Pure helper: is a payment overdue? ───────────────────────────────────────
// A payment for month "YYYY-MM" is overdue if it's still 'pending'
// and today is past the last day of that month.
export function isOverdue(month, status, now = new Date()) {
  if (status !== 'pending') return false;
  const [year, m] = month.split('-').map(Number);
  // Last moment of the payment month
  const dueDate = new Date(year, m, 0, 23, 59, 59, 999); // day=0 → last day of month m
  return now > dueDate;
}

// ─── POST /api/payments ────────────────────────────────────────────────────────
// society_admin only — single OR bulk (all flats in society for a given month)
export async function createCharge(req, res) {
  try {
    const { flatId, month, amount, type, bulk } = req.body;

    if (!month || !amount) {
      return res.status(400).json({ message: 'month and amount are required' });
    }

    // ── BULK mode: create charges for ALL flats in the society ─────────────
    if (bulk === true) {
      const flats = await Flat.find({ societyId: req.societyId });
      if (!flats.length) {
        return res.status(404).json({ message: 'No flats found in this society' });
      }

      const results = { created: [], skipped: [] };

      for (const flat of flats) {
        try {
          const payment = await Payment.create({
            societyId: req.societyId,
            flatId:    flat._id,
            ownerId:   flat.ownerId || req.user._id,
            amount,
            type:      type || 'maintenance',
            month,
            status:    'pending',
          });
          results.created.push(payment);
        } catch (err) {
          if (err.code === 11000) {
            // Unique index violation — charge for this flat/month already exists, skip
            results.skipped.push({
              flatId: flat._id,
              flatNumber: flat.flatNumber,
              reason: `Charge for month ${month} already exists`,
            });
          } else {
            throw err;
          }
        }
      }

      return res.status(201).json({
        message: `Bulk charge created. ${results.created.length} created, ${results.skipped.length} skipped (duplicates).`,
        created: results.created.length,
        skipped: results.skipped,
      });
    }

    // ── SINGLE mode ────────────────────────────────────────────────────────
    if (!flatId) {
      return res.status(400).json({ message: 'flatId is required for single charge (or set bulk=true)' });
    }

    const flat = await Flat.findById(flatId);
    if (!flat || !belongsToTenant(flat, req)) {
      return res.status(404).json({ message: 'Flat not found in this society' });
    }

    const payment = await Payment.create({
      societyId: req.societyId,
      flatId:    flat._id,
      ownerId:   flat.ownerId || req.user._id,
      amount,
      type:      type || 'maintenance',
      month,
      status:    'pending',
    });

    res.status(201).json(payment);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: `A charge for this flat and month (${req.body.month}) already exists` });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── GET /api/payments ────────────────────────────────────────────────────────
// society_admin: all in society (filterable)
// owner: only their own flat's payments
// resident: NO ACCESS (enforced in routes via authorize())
export async function getPayments(req, res) {
  try {
    const { status, month, flatId } = req.query;
    const filter = { societyId: req.societyId };

    if (status && status !== 'overdue') filter.status = status;
    if (month)  filter.month  = month;

    // Owner sees only their flat
    if (req.user.role === 'owner') {
      filter.flatId = req.user.flatId;
    } else if (req.user.role === 'society_admin' && flatId) {
      filter.flatId = flatId;
    }

    const payments = await Payment.find(filter)
      .populate('flatId',  'building flatNumber wing')
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 });

    // Virtual overdue enrichment
    const enriched = payments.map((p) => {
      const obj = typeof p.toObject === 'function' ? p.toObject() : { ...p };
      obj.isOverdue = isOverdue(p.month, p.status);
      return obj;
    });

    // Filter by overdue if requested
    if (status === 'overdue') {
      return res.json(enriched.filter((p) => p.isOverdue));
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── PATCH /api/payments/:id/mark-paid ────────────────────────────────────────
// society_admin only
export async function markAsPaid(req, res) {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment || !belongsToTenant(payment, req)) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'Payment is already marked as paid' });
    }

    payment.status = 'paid';
    payment.paidAt = new Date();
    await payment.save();

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── GET /api/payments/overdue ────────────────────────────────────────────────
// society_admin only — pending payments past their month's due date
export async function getOverduePayments(req, res) {
  try {
    const payments = await Payment.find({ societyId: req.societyId, status: 'pending' })
      .populate('flatId',  'building flatNumber wing')
      .populate('ownerId', 'name email phone')
      .sort({ month: 1 });

    const now      = new Date();
    const overdue  = payments.filter((p) => isOverdue(p.month, p.status, now));

    const enriched = overdue.map((p) => ({ ...(typeof p.toObject === 'function' ? p.toObject() : p), isOverdue: true }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── GET /api/payments/summary ────────────────────────────────────────────────
// society_admin only — single aggregation query for this month's stats
export async function getPaymentSummary(req, res) {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // default current month

    const [result] = await Payment.aggregate([
      { $match: { societyId: req.societyId, month } },
      {
        $group: {
          _id:          null,
          totalAmount:  { $sum: '$amount' },
          totalPaid:    { $sum: { $cond: [{ $eq: ['$status', 'paid'] },    '$amount', 0] } },
          totalPending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          countTotal:   { $sum: 1 },
          countPaid:    { $sum: { $cond: [{ $eq: ['$status', 'paid'] },    1, 0] } },
          countPending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        },
      },
    ]);

    res.json(
      result
        ? { month, ...result }
        : { month, totalAmount: 0, totalPaid: 0, totalPending: 0, countTotal: 0, countPaid: 0, countPending: 0 }
    );
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
