import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// One User model for ALL 5 roles — not 5 separate collections.
// role decides dashboard/permissions. societyId scopes them to a tenant.
// Super Admin is the only role where societyId can be null (platform-level).
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, minlength: 6, select: false },

    role: {
      type: String,
      enum: ['super_admin', 'society_admin', 'owner', 'resident', 'security_guard'],
      required: true,
    },

    // null ONLY for super_admin — every other role MUST have a societyId
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      default: null,
    },

    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      default: null, // relevant for owner/resident roles
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Enforce the multi-tenant rule at the schema level, not just convention
userSchema.pre('validate', function (next) {
  if (this.role !== 'super_admin' && !this.societyId) {
    return next(new Error(`societyId is required for role "${this.role}"`));
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Compound index: fast lookups scoped by tenant (critical for multi-tenant performance)
userSchema.index({ societyId: 1, role: 1 });

export default mongoose.model('User', userSchema);
