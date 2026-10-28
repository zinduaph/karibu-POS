import crypto from 'node:crypto';
import mongoose from 'mongoose';
import User from '../models/user.js';
import Restaurant from '../models/resturant.js';
import RefreshToken from '../models/refreshToken.js';
import {
  checkPassword,
  checkPin,
  hashPassword,
  hashPin,
} from '../utils/credentials.js';
import { verifyWithLockout } from '../utils/lockout.js';
import asyncHandler from '../utils/asyncHandler.js';
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
  mustChangePin: user.mustChangePin,
});

const invalid = (res) => res.status(401).json({ message: 'Invalid credentials' });
const unauthorized = (res) => res.status(401).json({ message: 'Unauthorized' });
const restaurantIsActive = (id) => Restaurant.exists({ _id: id, isActive: true });

async function startSession(user, res) {
  await issueRefresh(user, res);
  res.json({ accessToken: signAccess(user), user: publicUser(user) });
}

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

  await issueRefresh(user, res);
  res.status(201).json({
    accessToken: signAccess(user),
    user: publicUser(user),
    restaurant: {
      id: restaurant._id,
      name: restaurant.name,
      code: restaurant.code,
    },
  });
});

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: 'admin', isActive: true }).select('+passwordHash');

  if (!(await verifyWithLockout(user, checkPassword, password))) return invalid(res);
  if (!(await restaurantIsActive(user.restaurantId))) return unauthorized(res);

  await startSession(user, res);
});

export const cashierRegister = asyncHandler(async (req, res) => {
  const { name, username, pin } = req.body;
  const restaurantId = req.user.restaurantId;
  const restaurant = await Restaurant.findOne({ _id: restaurantId, isActive: true }).select('code');
  if (!restaurant) {
    return res.status(403).json({ message: 'Restaurant is not active' });
  }

  const user = new User({
    restaurantId,
    name,
    username,
    pinHash: await hashPin(pin),
    role: 'cashier',
    mustChangePin: true,
  });

  try {
    await user.save();
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(409).json({ message: 'A cashier with this username already exists' });
    }
    throw error;
  }

  res.status(201).json({
    user: {
      ...publicUser(user),
      username: user.username,
    },
    restaurantCode: restaurant.code,
  });
});

export const cashierLogin = asyncHandler(async (req, res) => {
  const { restaurantCode, username, pin } = req.body;
  const restaurant = await Restaurant.findOne({ code: restaurantCode, isActive: true });
  const user = restaurant
    ? await User.findOne({
        restaurantId: restaurant._id,
        username,
        role: 'cashier',
        isActive: true,
      }).select('+pinHash')
    : null;

  if (!(await verifyWithLockout(user, checkPin, pin))) return invalid(res);
  await startSession(user, res);
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
  await issueRefresh(user, res, token.family);
  res.json({ accessToken: signAccess(user), user: publicUser(user) });
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
  await revokeAllForUser(req.user.id);
  clearRefreshCookie(res);
  res.json({ ok: true });
});

export const unlock = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+pinHash');
  if (!(await verifyWithLockout(user, checkPin, req.body.pin))) return invalid(res);
  res.json({ ok: true });
});

export const changePin = asyncHandler(async (req, res) => {
  const { currentPin, newPin } = req.body;
  const user = await User.findById(req.user.id).select('+pinHash');

  if (!(await verifyWithLockout(user, checkPin, currentPin))) return invalid(res);

  user.pinHash = await hashPin(newPin);
  user.mustChangePin = false;
  user.tokenVersion += 1;
  await user.save();
  await revokeAllForUser(user._id);
  await startSession(user, res);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+passwordHash');

  if (!(await verifyWithLockout(user, checkPassword, currentPassword))) return invalid(res);

  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion += 1;
  await user.save();
  await revokeAllForUser(user._id);
  await startSession(user, res);
});