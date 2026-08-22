import FacilityBooking from '../models/FacilityBooking.js';
import { belongsToTenant } from '../middleware/tenant.js';

export const createBooking = async (req, res) => {
  try {
    const { flatId, facilityName, date, slot, purpose, notes } = req.body;
    let status = 'pending';
    
    // Admin auto-approves
    if (req.user.role === 'society_admin') {
      status = 'approved';
    }

    const bookingFlatId = req.user.flatId || flatId || null;

    const booking = new FacilityBooking({
      societyId: req.societyId,
      flatId: bookingFlatId,
      bookedBy: req.user._id,
      facilityName,
      date,
      slot,
      purpose,
      status,
      notes,
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Slot already booked for this facility on the given date.' });
    }
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
};

export const getBookings = async (req, res) => {
  try {
    const { date, facilityName, status } = req.query;
    const filter = {};
    if (req.societyId) filter.societyId = req.societyId;
    
    if (date) filter.date = new Date(date);
    if (facilityName) filter.facilityName = facilityName;
    if (status) filter.status = status;

    if (['owner', 'resident'].includes(req.user.role)) {
      filter.bookedBy = req.user._id;
    }

    const bookings = await FacilityBooking.find(filter)
      .populate('bookedBy', 'name email phone')
      .populate('flatId', 'building flatNumber wing')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};

export const approveBooking = async (req, res) => {
  try {
    const booking = await FacilityBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    if (!belongsToTenant(booking, req)) return res.status(404).json({ message: 'Booking not found' });
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be approved' });
    }
    
    booking.status = 'approved';
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error approving booking', error: error.message });
  }
};

export const rejectBooking = async (req, res) => {
  try {
    const booking = await FacilityBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    if (!belongsToTenant(booking, req)) return res.status(404).json({ message: 'Booking not found' });
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be rejected' });
    }
    
    booking.status = 'rejected';
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting booking', error: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await FacilityBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    if (!belongsToTenant(booking, req)) return res.status(404).json({ message: 'Booking not found' });
    
    if (req.user.role !== 'society_admin' && booking.bookedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    
    if (booking.status !== 'pending' && booking.status !== 'approved') {
      return res.status(400).json({ message: 'Only pending or approved bookings can be cancelled' });
    }
    
    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error: error.message });
  }
};
