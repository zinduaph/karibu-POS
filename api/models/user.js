import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'cashier'], required: true },

    email: { type: String, lowercase: true, trim: true },       // admin
    passwordHash: { type: String, select: false },

    username: { type: String, lowercase: true, trim: true },    // cashier
    pinHash: { type: String, select: false },

    isActive: { type: Boolean, default: true },
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 }, // bump = every access token dies instantly
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
userSchema.index(
  { restaurantId: 1, username: 1 },
  { unique: true, partialFilterExpression: { username: { $type: 'string' } } }
);

// Safety net: hashes can never leak through res.json(user)
userSchema.set('toJSON', {
  transform: (_d, ret) => {
    delete ret.passwordHash; delete ret.pinHash; delete ret.failedAttempts;
    delete ret.lockUntil; delete ret.tokenVersion; delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);