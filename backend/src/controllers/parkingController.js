import ParkingSlot from '../models/ParkingSlot.js';
import Visitor from '../models/Visitor.js';
import Flat from '../models/Flat.js';
import { belongsToTenant } from '../middleware/tenant.js';

// ─── POST /api/parking/slots/bulk ────────────────────────────────────────────
// society_admin only — bulk create slots e.g. A1-A20
// Body: { prefix: "A", from: 1, to: 20, type: "car" }
//    OR: { slots: ["A1","A2","A3"], type: "car" }
export async function createParkingSlots(req, res) {
  try {
    const { prefix, from, to, type, slots } = req.body;

    let slotNumbers = [];

    if (Array.isArray(slots) && slots.length) {
      slotNumbers = slots.map((s) => String(s).trim().toUpperCase());
    } else if (prefix && from != null && to != null) {
      const start = parseInt(from);
      const end   = parseInt(to);
      if (start > end || end - start > 500) {
        return res.status(400).json({ message: 'Invalid range. Max 500 slots per bulk call.' });
      }
      for (let i = start; i <= end; i++) {
        slotNumbers.push(`${prefix.toUpperCase()}${i}`);
      }
    } else {
      return res.status(400).json({
        message: 'Provide either { slots: [...] } or { prefix, from, to }',
      });
    }

    const results = { created: [], skipped: [] };

    for (const slotNumber of slotNumbers) {
      try {
        const slot = await ParkingSlot.create({
          societyId: req.societyId,
          slotNumber,
          type:      type || 'car',
        });
        results.created.push(slot);
      } catch (err) {
        if (err.code === 11000) {
          results.skipped.push({ slotNumber, reason: 'Already exists' });
        } else {
          throw err;
        }
      }
    }

    res.status(201).json({
      message: `${results.created.length} slots created, ${results.skipped.length} skipped (duplicates).`,
      created: results.created.length,
      skipped: results.skipped,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── GET /api/parking/slots ───────────────────────────────────────────────────
// society_admin: full view including vehicleNumber and allocatedToFlatId
// owner/resident: slot number, type, isAllocated — their own flat's slot highlighted
//   but NO other flats' vehicle numbers
export async function getParkingSlots(req, res) {
  try {
    const { type, isAllocated } = req.query;
    const filter = { societyId: req.societyId };

    if (type)        filter.type        = type;
    if (isAllocated !== undefined) filter.isAllocated = isAllocated === 'true';

    const slots = await ParkingSlot.find(filter)
      .populate('allocatedToFlatId', 'building flatNumber wing')
      .sort({ slotNumber: 1 });

    const role = req.user.role;

    // owner/resident: scrub other flats' vehicle numbers
    if (['owner', 'resident'].includes(role)) {
      const userFlatId = req.user.flatId?.toString();
      const sanitized = slots.map((slot) => {
        const obj = slot.toObject();
        const isOwnFlat =
          obj.allocatedToFlatId &&
          obj.allocatedToFlatId._id?.toString() === userFlatId;

        if (!isOwnFlat) {
          // Show slot occupancy but NOT the other flat's vehicle number
          delete obj.vehicleNumber;
        }
        return obj;
      });
      return res.json(sanitized);
    }

    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── PATCH /api/parking/slots/:id/allocate ────────────────────────────────────
// society_admin only — assigns a slot to a flat + vehicle number
export async function allocateSlot(req, res) {
  try {
    const { flatId, vehicleNumber } = req.body;

    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot || !belongsToTenant(slot, req)) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    if (slot.isAllocated) {
      return res.status(400).json({
        message: `Slot "${slot.slotNumber}" is already allocated. Deallocate it first before reallocating.`,
      });
    }

    const flat = await Flat.findById(flatId);
    if (!flat || !belongsToTenant(flat, req)) {
      return res.status(404).json({ message: 'Flat not found in this society' });
    }

    slot.isAllocated       = true;
    slot.allocatedToFlatId = flat._id;
    slot.vehicleNumber     = vehicleNumber?.trim()?.toUpperCase() || null;
    await slot.save();

    res.json(slot);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── PATCH /api/parking/slots/:id/deallocate ─────────────────────────────────
// society_admin only — clears both allocatedToFlatId and vehicleNumber
export async function deallocateSlot(req, res) {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot || !belongsToTenant(slot, req)) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    if (!slot.isAllocated) {
      return res.status(400).json({ message: `Slot "${slot.slotNumber}" is not currently allocated.` });
    }

    slot.isAllocated       = false;
    slot.allocatedToFlatId = null;
    slot.vehicleNumber     = null;
    await slot.save();

    res.json(slot);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ─── GET /api/parking/verify-vehicle ─────────────────────────────────────────
// security_guard only — checks a vehicle number against approved visitor records
// DOES NOT expose resident slot/vehicle data — only visitor match result
export async function verifyVisitorVehicle(req, res) {
  try {
    const { vehicleNumber } = req.query;

    if (!vehicleNumber?.trim()) {
      return res.status(400).json({ message: 'vehicleNumber query parameter is required' });
    }

    const normalized = vehicleNumber.trim().toUpperCase();

    // Query Visitor model ONLY — do not touch ParkingSlot resident data
    const visitorMatch = await Visitor.findOne({
      societyId:     req.societyId,
      vehicleNumber: { $regex: new RegExp(`^${normalized}$`, 'i') },
      status:        { $in: ['approved', 'checked_in'] },
    }).populate('flatId', 'building flatNumber wing');

    if (!visitorMatch) {
      return res.json({
        matched:    false,
        vehicleNumber: normalized,
        message:    'No approved visitor found with this vehicle number.',
      });
    }

    // Return only gate-relevant fields — no resident personal data
    res.json({
      matched:       true,
      vehicleNumber: normalized,
      visitor: {
        name:       visitorMatch.name,
        purpose:    visitorMatch.purpose,
        status:     visitorMatch.status,
        flat:       visitorMatch.flatId,
        checkInTime: visitorMatch.checkInTime,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
