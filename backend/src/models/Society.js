import mongoose from 'mongoose';

// Society = the "tenant". Every other collection references this via societyId.
const societySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    totalFlats: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Society', societySchema);
