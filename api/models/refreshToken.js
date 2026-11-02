import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, refPath: 'userModel' },
  userModel: { type: String, enum: ['User'], required: true },
  tokenHash: { type: String, required: true, unique: true },
  family: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
});
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.index(
  { userId: 1, userModel: 1 },
  { unique: true, partialFilterExpression: { revokedAt: { $exists: false } } }
);

export default mongoose.model('RefreshToken', refreshTokenSchema);
