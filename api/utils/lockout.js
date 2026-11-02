const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60e3;

export async function verifyWithLockout(user, Model, checkFn, secret) {
  const locked = user?.lockUntil && user.lockUntil > new Date();
  const ok = await checkFn(user, secret);
  if (!user || locked) return false;

  if (!ok) {
    const updated = await Model.findByIdAndUpdate(user._id, { $inc: { failedAttempts: 1 } }, { new: true });
    if (updated.failedAttempts >= MAX_ATTEMPTS) {
      await Model.updateOne({ _id: user._id }, { failedAttempts: 0, lockUntil: new Date(Date.now() + LOCK_MS) });
    }
    return false;
  }
  await Model.updateOne({ _id: user._id }, { failedAttempts: 0, lockUntil: null, lastLoginAt: new Date() });
  return true;
}
