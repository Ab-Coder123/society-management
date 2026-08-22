import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    name: { type: String, required: true },
    phone: { type: String },
    purpose: { type: String, enum: ['guest', 'delivery', 'service', 'other'], default: 'guest' },
    vehicleNumber: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'checked_in', 'checked_out', 'rejected'],
      default: 'pending',
    },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    loggedBySecurity: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

visitorSchema.index({ societyId: 1, status: 1 });

export default mongoose.model('Visitor', visitorSchema);
