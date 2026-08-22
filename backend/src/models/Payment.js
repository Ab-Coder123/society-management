import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['maintenance', 'penalty', 'other'], default: 'maintenance' },
    month: { type: String, required: true }, // e.g. "2026-08"
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ societyId: 1, flatId: 1, month: 1 }, { unique: true });

export default mongoose.model('Payment', paymentSchema);
