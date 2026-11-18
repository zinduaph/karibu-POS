import crypto from 'node:crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/cashier.js';
import Restaurant from '../models/resturant.js';
import RefreshToken from '../models/refreshToken.js';
import PasswordResetToken from '../models/passwordResetToken.js';
import {
  checkPassword,
  checkPin,
  hashPassword,
  hashPin,
} from '../utils/credentials.js';
import { verifyWithLockout } from '../utils/lockout.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendAdminPasswordResetCode } from '../utils/email.js';
import {
  clearRefreshCookie,
  issueRefresh,
  readRefreshCookie,
  revokeAllForUser,
  sha256,
  signAccess,
} from '../utils/token.js';

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  role: user.role,
  restaurantId: user.restaurantId,
  onboarded: user.onboarded === true,
  onboardingStep: user.onboardingStep,
  ...(user.role === 'admin' ? { mustChangePassword: user.mustChangePassword } : {}),
});

const invalid = (res) => res.status(401).json({ message: 'Invalid credentials' });
const unauthorized = (res) => res.status(401).json({ message: 'Unauthorized' });
const restaurantIsActive = (id) => Restaurant.exists({ _id: id, isActive: true });

async function startSession(user, res, additionalData = {}) {
  await issueRefresh(user, res, user.role);
  res.json({ accessToken: signAccess(user, user.role), user: publicUser(user), ...additionalData });
}

export const devLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const devEmail = process.env.DEV_EMAIL;
  const devPassword = process.env.DEV_PASSWORD;
  const devSecret = process.env.DEV_JWT_SECRET;

  if (!devEmail || !devPassword || !devSecret) {
    return res.status(503).json({ message: 'Developer login is not configured' });
  }
  if (email !== devEmail || password !== devPassword) {
    return res.status(401).json({ message: 'Invalid developer credentials' });
  }

  const token = jwt.sign({ role: 'developer' }, devSecret, {
    algorithm: 'HS256',
    expiresIn: '1d',
  });
  return res.json({ message: 'Developer login successful', token });
});

export const adminRegister = asyncHandler(async (req, res) => {
  const { name, email, password, restaurantName } = req.body;
  const passwordHash = await hashPassword(password);
  const session = await mongoose.startSession();
  let restaurant;
  let user;

  try {
    await session.withTransaction(async () => {
      restaurant = new Restaurant({
        name: restaurantName,
        code: `KRB-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
      });
      await restaurant.save({ session });

      user = new User({
        restaurantId: restaurant._id,
        name,
        email,
        passwordHash,
        role: 'admin',
      });
      await user.save({ session });
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    throw error;
  } finally {
    await session.endSession();
  }

  await issueRefresh(user, res, user.role);
  res.status(201).json({
    accessToken: signAccess(user, user.role),
    user: publicUser(user),
    restaurant: {
      id: restaurant._id,
      name: restaurant.name,
      code: restaurant.code,
    },
  });
});

export const cashierRegister = asyncHandler(async (req, res) => {
  const { name, username, pin } = req.body;
  const adminRestaurantId = req.user.restaurantId;

  const existing = await User.findOne({
    restaurantId: adminRestaurantId,
    username,
    role: 'cashier',
  });

  if (existing) {
    return res.status(409).json({ message: 'A cashier with that username already exists for this restaurant' });
  }

  const user = await User.create({
    restaurantId: adminRestaurantId,
    adminId: req.user.id,
    name,
    username,
    role: 'cashier',
    pinHash: await hashPin(pin),
    isActive: true,
  });

  const restaurant = await Restaurant.findById(adminRestaurantId);

  res.status(201).json({
    user: publicUser(user),
    restaurantId: user.restaurantId,
    username: user.username,
    restaurantCode: restaurant?.code,
    message: 'Cashier account created successfully. Share the PIN with the cashier securely.',
  });
});

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: 'admin', isActive: true }).select('+passwordHash');

  if (!(await verifyWithLockout(user, User, checkPassword, password))) return invalid(res);
  const restaurant = await Restaurant.findOne({ _id: user.restaurantId, isActive: true });
  if (!restaurant) return unauthorized(res);

  await startSession(user, res, {
    restaurant: {
      id: restaurant._id,
      name: restaurant.name,
      code: restaurant.code,
    },
  });
});

export const cashierLogin = asyncHandler(async (req, res) => {
  if (!process.env.PIN_PEPPER) {
    console.error('[cashierLogin] PIN_PEPPER is not set — pin verification will always fail');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const { restaurantCode, username, pin } = req.body;
  const restaurant = await Restaurant.findOne({ code: restaurantCode, isActive: true });
  if (!restaurant) {
    const allRestaurants = await Restaurant.find({}, { code: 1, isActive: 1, _id: 0 });
    console.warn('[cashierLogin] restaurant not found:', restaurantCode, 'existing:', JSON.stringify(allRestaurants));
    return invalid(res);
  }

  const user = await User.findOne({
    restaurantId: restaurant._id,
    username,
    role: 'cashier',
    isActive: true,
  }).select('+pinHash');

  if (!user) {
    console.warn('[cashierLogin] cashier not found:', { restaurantCode, username });
    return invalid(res);
  }

  const ok = await verifyWithLockout(user, User, checkPin, pin);
  if (!ok) {
    console.warn('[cashierLogin] pin mismatch:', { restaurantCode, username });
    return invalid(res);
  }
  await startSession(user, res);
});

// Delete a cashier account belonging to the authenticated admin's restaurant.
export const deleteCashier = asyncHandler(async (req, res) => {
  const { cashierId } = req.params;
  const adminRestaurantId = req.user.restaurantId;
  if (!mongoose.isValidObjectId(cashierId)) {
    return res.status(400).json({ message: 'Invalid cashierId' });
  }

  const cashier = await User.findOneAndDelete({
    _id: cashierId,
    restaurantId: adminRestaurantId,
    role: 'cashier',
  });
  if (!cashier) return res.status(404).json({ message: 'Cashier not found' });

  return res.status(200).json({ message: 'Cashier deleted successfully' });
});

// function for admin to reset his password
 export const resetAdminPassword = asyncHandler(async (req,res) => {
  const restaurantId = req.user.restaurantId;
  const { newpassword} = req.body;
  try {
    const admin = await User.findOne({ restaurantId, role: 'admin'});
    if(!admin){
      return res.status(404).json({ message: 'Admin not found' });
    }
    admin.passwordHash = await hashPassword(newpassword);
    admin.mustChangePassword = false;
    await admin.save();
    res.status(200).json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Error resetting admin password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})

export const requestAdminPasswordReset = asyncHandler(async (req, res) => {
  const response = {
    message: 'If an active admin account exists for that email, a password reset code will be sent.',
  };
  const user = await User.findOne({
    email: req.body.email,
    role: 'admin',
    isActive: true,
  }).select('_id email');

  if (!user) return res.status(200).json(response);

  await PasswordResetToken.deleteMany({ userId: user._id });
  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = crypto.createHmac('sha256', process.env.ACCESS_TOKEN)
    .update(`${user._id}:${code}`)
    .digest('hex');
  await PasswordResetToken.create({
    userId: user._id,
    codeHash,
    attemptsRemaining: 5,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  try {
    await sendAdminPasswordResetCode(user.email, code);
  } catch (error) {
    await PasswordResetToken.deleteOne({ userId: user._id, codeHash });
    console.error('Unable to send admin password reset email:', error);
    return res.status(503).json({ message: 'Password recovery email could not be sent. Please try again later.' });
  }

  return res.status(200).json(response);
});

export const completeAdminPasswordReset = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await User.findOne({
    email,
    role: 'admin',
    isActive: true,
  }).select('_id');
  if (!user) {
    return res.status(400).json({ message: 'The code is invalid or expired. Request a new one.' });
  }

  const now = new Date();
  const resetRecord = await PasswordResetToken.findOne({
    userId: user._id,
    expiresAt: { $gt: now },
  });

  if (!resetRecord) {
    return res.status(400).json({ message: 'The code is invalid or expired. Request a new one.' });
  }

  const codeHash = crypto.createHmac('sha256', process.env.ACCESS_TOKEN)
    .update(`${user._id}:${code}`)
    .digest('hex');
  const candidate = Buffer.from(codeHash, 'hex');
  const stored = Buffer.from(resetRecord.codeHash, 'hex');
  const isValidCode = candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);

  if (!isValidCode) {
    const updatedRecord = await PasswordResetToken.findOneAndUpdate(
      { _id: resetRecord._id, attemptsRemaining: { $gt: 0 }, expiresAt: { $gt: now } },
      { $inc: { attemptsRemaining: -1 } },
      { new: true },
    );
    if (updatedRecord?.attemptsRemaining === 0) {
      await PasswordResetToken.deleteOne({ _id: updatedRecord._id });
    }
    return res.status(400).json({ message: 'The code is invalid or expired. Request a new one.' });
  }

  const consumedRecord = await PasswordResetToken.findOneAndDelete({
    _id: resetRecord._id,
    codeHash,
    attemptsRemaining: { $gt: 0 },
    expiresAt: { $gt: now },
  });
  if (!consumedRecord) {
    return res.status(400).json({ message: 'The code is invalid or expired. Request a new one.' });
  }

  const passwordHash = await hashPassword(newPassword);
  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id, role: 'admin', isActive: true },
    { $set: { passwordHash, mustChangePassword: false }, $inc: { tokenVersion: 1 } },
    { new: true },
  ).select('_id');

  if (!updatedUser) {
    return res.status(400).json({ message: 'The code is invalid or expired. Request a new one.' });
  }

  await Promise.all([
    PasswordResetToken.deleteMany({ userId: updatedUser._id }),
    revokeAllForUser(updatedUser._id, 'User'),
  ]);

  return res.status(200).json({ message: 'Password reset successfully. You can now sign in with your new password.' });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const raw = readRefreshCookie(req);
  if (!raw) return unauthorized(res);

  const token = await RefreshToken.findOne({ tokenHash: sha256(raw) });
  if (!token) return unauthorized(res);

  if (token.revokedAt) {
    await RefreshToken.updateMany({ family: token.family }, { revokedAt: new Date() });
    console.warn('Refresh token reuse detected for user', String(token.userId));
    return unauthorized(res);
  }
  if (token.expiresAt < new Date()) return unauthorized(res);

  const user = await User.findOne({ _id: token.userId, isActive: true });
  if (!user || !(await restaurantIsActive(user.restaurantId))) return unauthorized(res);

  token.revokedAt = new Date();
  await token.save();
  await issueRefresh(user, res, user.role, token.family);
  res.json({ accessToken: signAccess(user, user.role), user: publicUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  const raw = readRefreshCookie(req);
  if (raw) await RefreshToken.updateOne({ tokenHash: sha256(raw) }, { revokedAt: new Date() });
  clearRefreshCookie(res);
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.user.id, isActive: true });
  if (!user) return unauthorized(res);
  res.json({ user: publicUser(user) });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user.id }, { $inc: { tokenVersion: 1 } });
  await revokeAllForUser(req.user.id, 'User');
  clearRefreshCookie(res);
  res.json({ ok: true });
});

export const unlock = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+pinHash');
  if (!(await verifyWithLockout(user, User, checkPin, req.body.pin))) return invalid(res);
  res.json({ ok: true });
});

export const changePin = asyncHandler(async (req, res) => {
  const { currentPin, newPin } = req.body;
  const user = await User.findById(req.user.id).select('+pinHash');

  if (!(await verifyWithLockout(user, User, checkPin, currentPin))) return invalid(res);

  user.pinHash = await hashPin(newPin);
  user.tokenVersion += 1;
  await user.save();
  await revokeAllForUser(user._id, 'User');
  await startSession(user, res);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+passwordHash');

  if (!(await verifyWithLockout(user, User, checkPassword, currentPassword))) return invalid(res);

  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion += 1;
  await user.save();
  await revokeAllForUser(user._id, 'User');
  await startSession(user, res);
});

export const getCashier = asyncHandler(async (req, res) => {
  const cashiers = await User.find({
    restaurantId: req.user.restaurantId,
    role: 'cashier',
  })
    .select('name username lastLoginAt')
    .sort({ name: 1 })
    .lean();

  res.json({ cashiers });
});
