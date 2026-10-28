import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true }, // only the hash is stored
  family: { type: String, required: true, index: true },     // one family per login session
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
});
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-cleanup

export default mongoose.model('RefreshToken', refreshTokenSchema);