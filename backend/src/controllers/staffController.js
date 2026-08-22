import Staff from '../models/Staff.js';
import { belongsToTenant } from '../middleware/tenant.js';

export const createStaff = async (req, res) => {
  try {
    const staff = new Staff({
      ...req.body,
      societyId: req.societyId,
    });
    await staff.save();
    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error creating staff', error: error.message });
  }
};

export const getStaff = async (req, res) => {
  try {
    const { role, isActive } = req.query;
    const filter = {};
    if (req.societyId) filter.societyId = req.societyId;
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const staff = await Staff.find(filter).sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff', error: error.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    
    if (!belongsToTenant(staff, req)) return res.status(404).json({ message: 'Staff not found' });
    
    Object.assign(staff, req.body);
    await staff.save();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error updating staff', error: error.message });
  }
};

export const deactivateStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    
    if (!belongsToTenant(staff, req)) return res.status(404).json({ message: 'Staff not found' });
    
    staff.isActive = false;
    await staff.save();
    res.json({ message: 'Staff deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating staff', error: error.message });
  }
};
