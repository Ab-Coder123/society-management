import Event from '../models/Event.js';
import { belongsToTenant } from '../middleware/tenant.js';

export const createEvent = async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      societyId: req.societyId,
      createdBy: req.user._id,
    });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const { upcoming } = req.query;
    const filter = { isActive: true };
    if (req.societyId) filter.societyId = req.societyId;
    
    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.date = { $gte: today };
    }
    
    const events = await Event.find(filter).populate('createdBy', 'name').sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (!belongsToTenant(event, req)) return res.status(404).json({ message: 'Event not found' });
    
    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (!belongsToTenant(event, req)) return res.status(404).json({ message: 'Event not found' });
    
    event.isActive = false;
    await event.save();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
};

export const rsvpToEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (!belongsToTenant(event, req)) return res.status(404).json({ message: 'Event not found' });
    
    if (!event.isActive) return res.status(400).json({ message: 'Event is no longer active' });
    
    const userIdStr = req.user._id.toString();
    const isAlreadyRsvped = (event.rsvpList || []).some(r => r.userId?.toString() === userIdStr);
    if (isAlreadyRsvped) {
      return res.status(400).json({ message: 'Already RSVPed to this event' });
    }
    
    if (event.maxAttendees !== null && (event.rsvpList || []).length >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event has reached maximum attendees' });
    }
    
    event.rsvpList.push({
      userId: req.user._id,
      name: req.user.name || 'Resident',
      phone: req.user.phone || '',
      rsvpAt: new Date(),
    });
    
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error RSVPing to event', error: error.message });
  }
};
