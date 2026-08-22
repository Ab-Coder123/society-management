import mongoose from 'mongoose';

const parkingSlotSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    slotNumber: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['car', 'bike', 'guest'],
      default: 'car',
    },
    isAllocated: {
      type: Boolean,
      default: false,
    },
    allocatedToFlatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      default: null,
    },
    vehicleNumber: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

// A slot number must be unique within a society
parkingSlotSchema.index({ societyId: 1, slotNumber: 1 }, { unique: true });

export default mongoose.model('ParkingSlot', parkingSlotSchema);
