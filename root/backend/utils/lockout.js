import User from '../model/userModel.js';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60e3;

// Checks a password/PIN with lockout: 5 failures locks the account for 15 minutes.
// `checkFn` always runs, so response time is similar for unknown users.
export async function verifyWithLockout(user, checkFn, secret) {
  const locked = user?.lockUntil && user.lockUntil > new Date();
  const ok = await checkFn(user, secret);
  if (!user || locked) return false;

  if (!ok) {
    const updated = await User.findByIdAndUpdate(user._id, { $inc: { failedAttempts: 1 } }, { new: true });
    if (updated.failedAttempts >= MAX_ATTEMPTS) {
      await User.updateOne({ _id: user._id }, { failedAttempts: 0, lockUntil: new Date(Date.now() + LOCK_MS) });
    }
    return false;
  }
  await User.updateOne({ _id: user._id }, { failedAttempts: 0, lockUntil: null, lastLoginAt: new Date() });
  return true;
}