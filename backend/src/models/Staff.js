import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['security', 'maintenance', 'housekeeping', 'gardener', 'electrician', 'plumber', 'other'],
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'night', 'rotating'],
    default: 'morning'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('Staff', staffSchema);
