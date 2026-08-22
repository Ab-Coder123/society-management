import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat' },
    category: {
      type: String,
      enum: ['maintenance', 'security', 'noise', 'cleanliness', 'other'],
      required: true,
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['raised', 'assigned', 'in_progress', 'resolved', 'closed'],
      default: 'raised',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reopenCount: { type: Number, default: 0 },
    attachments: [{ type: String }], // file URLs
    comments: [
      {
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

complaintSchema.index({ societyId: 1, status: 1 });

export default mongoose.model('Complaint', complaintSchema);
