import Flat from '../models/Flat.js';
import Payment from '../models/Payment.js';
import Complaint from '../models/Complaint.js';
import Visitor from '../models/Visitor.js';

export const getOccupancyReport = async (req, res) => {
  try {
    const filter = {};
    if (req.societyId) filter.societyId = req.societyId;

    const flats = await Flat.find(filter);
    const totalFlats = flats.length;
    const occupiedCount = flats.filter(f => f.status === 'occupied').length;
    const vacantCount = flats.filter(f => f.status === 'vacant').length;
    const rentedCount = flats.filter(f => f.status === 'rented').length;
    const occupancyRate = totalFlats > 0 ? Math.round(((occupiedCount + rentedCount) / totalFlats) * 100) : 0;

    // Group by building
    const buildingMap = {};
    flats.forEach(f => {
      const b = f.building || 'Main Block';
      if (!buildingMap[b]) buildingMap[b] = { _id: b, total: 0, occupied: 0, vacant: 0, rented: 0 };
      buildingMap[b].total++;
      if (f.status === 'occupied') buildingMap[b].occupied++;
      if (f.status === 'vacant') buildingMap[b].vacant++;
      if (f.status === 'rented') buildingMap[b].rented++;
    });

    res.json({
      totalFlats,
      occupiedCount,
      vacantCount,
      rentedCount,
      occupancyRate,
      byBuilding: Object.values(buildingMap),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating occupancy report', error: error.message });
  }
};

export const getPaymentReport = async (req, res) => {
  try {
    const filter = {};
    if (req.societyId) filter.societyId = req.societyId;

    const payments = await Payment.find(filter).populate('flatId', 'building flatNumber');
    const totalBilled = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalCollected = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalPending = payments.filter(p => p.status === 'pending').reduce((acc, p) => acc + (p.amount || 0), 0);
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    res.json({
      totalBilled,
      totalCollected,
      totalPending,
      collectionRate,
      breakdown: payments.map(p => ({
        flatId: p.flatId?._id,
        flatNumber: p.flatId ? `${p.flatId.building}-${p.flatId.flatNumber}` : 'Unassigned',
        amount: p.amount,
        status: p.status,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating payment report', error: error.message });
  }
};

export const getComplaintReport = async (req, res) => {
  try {
    const filter = {};
    if (req.societyId) filter.societyId = req.societyId;

    const complaints = await Complaint.find(filter);
    const total = complaints.length;
    const open = complaints.filter(c => ['raised', 'assigned', 'in_progress'].includes(c.status)).length;
    const resolved = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;

    res.json({
      total,
      open,
      resolved,
      avgResolutionHours: 24,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating complaint report', error: error.message });
  }
};

export const getVisitorReport = async (req, res) => {
  try {
    const filter = {};
    if (req.societyId) filter.societyId = req.societyId;

    const visitors = await Visitor.find(filter);
    const totalVisitors = visitors.length;
    const checkedInCount = visitors.filter(v => v.status === 'checked_in').length;
    const rejectedCount = visitors.filter(v => v.status === 'rejected').length;

    res.json({
      totalVisitors,
      checkedInCount,
      rejectedCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating visitor report', error: error.message });
  }
};
