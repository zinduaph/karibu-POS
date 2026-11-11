import crypto from 'node:crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/cashier.js';
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
  onboarded: user.onboarded === true,
  onboardingStep: user.onboardingStep,
  ...(user.role === 'admin' ? { mustChangePassword: user.mustChangePassword } : { mustChangePin: user.mustChangePin }),
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
    mustChangePin: true,
    isActive: true,
  });

  const restaurant = await Restaurant.findById(adminRestaurantId);

  res.status(201).json({
    user: publicUser(user),
    restaurantId: user.restaurantId,
    username: user.username,
    restaurantCode: restaurant?.code,
    message: 'Cashier account created successfully. Ask the cashier to change the PIN on first login.',
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
  user.mustChangePin = false;
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
