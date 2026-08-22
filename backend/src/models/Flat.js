import mongoose from 'mongoose';

const flatSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
    building: { type: String, required: true },
    wing: { type: String },
    flatNumber: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    residentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    occupancyStatus: {
      type: String,
      enum: ['occupied', 'vacant', 'rented'],
      default: 'vacant',
    },
  },
  { timestamps: true }
);

flatSchema.index({ societyId: 1, building: 1, flatNumber: 1 }, { unique: true });

export default mongoose.model('Flat', flatSchema);
