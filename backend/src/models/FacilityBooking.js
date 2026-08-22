import mongoose from 'mongoose';

const facilityBookingSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  flatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: true
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  facilityName: {
    type: String,
    enum: ['gym', 'clubhouse', 'pool', 'garden', 'parking_visitor', 'other'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  slot: {
    type: String,
    required: true
  },
  purpose: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

facilityBookingSchema.index({ societyId: 1, facilityName: 1, date: 1, slot: 1 }, { unique: true });

export default mongoose.model('FacilityBooking', facilityBookingSchema);
