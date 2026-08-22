import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: {
      type: String,
      enum: ['maintenance', 'meeting', 'utility', 'emergency', 'holiday', 'general'],
      default: 'general',
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

noticeSchema.index({ societyId: 1, createdAt: -1 });

export default mongoose.model('Notice', noticeSchema);
