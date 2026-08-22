import Flat from '../models/Flat.js';
import User from '../models/User.js';
import { belongsToTenant } from '../middleware/tenant.js';

// POST /api/flats
export async function createFlat(req, res) {
  try {
    const flat = await Flat.create({
      building: req.body.building,
      wing: req.body.wing,
      flatNumber: req.body.flatNumber,
      occupancyStatus: req.body.occupancyStatus,
      societyId: req.societyId,
    });
    res.status(201).json(flat);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// GET /api/flats
export async function getFlats(req, res) {
  try {
    const filter = req.societyId ? { societyId: req.societyId } : {};
    const flats = await Flat.find(filter)
      .populate('ownerId', 'name email phone')
      .sort({ building: 1, flatNumber: 1 });
    res.json(flats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// GET /api/flats/occupancy-summary
export async function getFlatOccupancySummary(req, res) {
  try {
    const match = req.societyId ? { societyId: req.societyId } : {};
    const summary = await Flat.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$occupancyStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = { occupied: 0, vacant: 0, rented: 0, total: 0 };
    summary.forEach((item) => {
      if (item._id && result[item._id] !== undefined) {
        result[item._id] = item.count;
      }
      result.total += item.count;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// GET /api/flats/by-building
export async function getFlatsByBuilding(req, res) {
  try {
    const match = req.societyId ? { societyId: req.societyId } : {};
    const grouped = await Flat.aggregate([
      { $match: match },
      { $sort: { flatNumber: 1 } },
      {
        $group: {
          _id: '$building',
          flats: { $push: '$$ROOT' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = {};
    grouped.forEach((item) => {
      result[item._id] = item.flats;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// GET /api/flats/search
export async function searchFlats(req, res) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json([]);
    }

    const match = req.societyId ? { societyId: req.societyId } : {};

    const flats = await Flat.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'owner',
        },
      },
      {
        $unwind: {
          path: '$owner',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            { flatNumber: { $regex: query, $options: 'i' } },
            { 'owner.name': { $regex: query, $options: 'i' } },
          ],
        },
      },
    ]);

    res.json(flats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// GET /api/flats/:id
export async function getFlatById(req, res) {
  try {
    const flat = await Flat.findById(req.params.id).populate('ownerId', 'name email phone');
    if (!flat || !belongsToTenant(flat, req)) {
      return res.status(404).json({ message: 'Flat not found' });
    }
    res.json(flat);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// PATCH /api/flats/:id
export async function updateFlat(req, res) {
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat || !belongsToTenant(flat, req)) {
      return res.status(404).json({ message: 'Flat not found' });
    }

    flat.building = req.body.building ?? flat.building;
    flat.wing = req.body.wing ?? flat.wing;
    flat.flatNumber = req.body.flatNumber ?? flat.flatNumber;
    flat.occupancyStatus = req.body.occupancyStatus ?? flat.occupancyStatus;

    await flat.save();
    res.json(flat);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// PATCH /api/flats/:id/owner
export async function assignOwnerToFlat(req, res) {
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat || !belongsToTenant(flat, req)) {
      return res.status(404).json({ message: 'Flat not found' });
    }

    const user = await User.findById(req.body.ownerId);
    if (!user || !belongsToTenant(user, req)) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    flat.ownerId = user._id;

    await flat.save();
    await User.findByIdAndUpdate(user._id, { flatId: flat._id }, { runValidators: true });

    res.json(flat);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
