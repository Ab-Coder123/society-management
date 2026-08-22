import Society from '../models/Society.js';
import Flat from '../models/Flat.js';
import User from '../models/User.js';
import { belongsToTenant } from '../middleware/tenant.js';

// POST /api/societies
export async function createSociety(req, res) {
  try {
    const society = await Society.create(req.body);
    res.status(201).json(society);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// GET /api/societies
export async function getSocieties(req, res) {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { _id: req.societyId };
    const societies = await Society.find(filter).sort({ createdAt: -1 });
    res.json(societies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// GET /api/societies/stats (super_admin only)
export async function getSocietyStats(req, res) {
  try {
    const totalSocieties = await Society.countDocuments();
    const totalFlats = await Flat.countDocuments();
    const totalActiveUsers = await User.countDocuments({ isActive: true });

    const societyBreakdown = await Society.aggregate([
      {
        $lookup: {
          from: 'flats',
          localField: '_id',
          foreignField: 'societyId',
          as: 'flats',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'societyId',
          as: 'users',
        },
      },
      {
        $project: {
          name: 1,
          city: 1,
          isActive: 1,
          flatCount: { $size: '$flats' },
          userCount: {
            $size: {
              $filter: {
                input: '$users',
                as: 'u',
                cond: { $eq: ['$$u.isActive', true] },
              },
            },
          },
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json({
      totalSocieties,
      totalFlats,
      totalActiveUsers,
      societies: societyBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// GET /api/societies/:id
export async function getSocietyById(req, res) {
  try {
    const society = await Society.findById(req.params.id);
    if (!society || !belongsToTenant({ societyId: society._id }, req)) {
      return res.status(404).json({ message: 'Society not found' });
    }
    res.json(society);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// PATCH /api/societies/:id
export async function updateSociety(req, res) {
  try {
    const society = await Society.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }
    res.json(society);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// DELETE /api/societies/:id
export async function deactivateSociety(req, res) {
  try {
    const society = await Society.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true, runValidators: true }
    );
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }
    res.json(society);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
