import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.js';
import Restaurant from '../models/resturant.js';
import { verifyWithLockout } from '../utils/lockout.js';
import { checkPassword } from '../utils/credentials.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const STEP_ORDER_ADMIN = ['password', 'restaurant', 'inventory', 'cashiers', 'complete'];

export const getOnboardingStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: 'User not found' });
  res.json({
    onboardingStep: user.onboardingStep,
    onboarded: user.onboarded,
    role: user.role,
    restaurantId: user.restaurantId,
    mustChangePassword: user.role === 'admin' && user.mustChangePassword,
    mustChangePin: user.role === 'cashier' && user.mustChangePin,
  });
});

export const adminChangePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  if (!(await verifyWithLockout(user, checkPassword, currentPassword))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const bcrypt = await import('bcrypt');
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  user.tokenVersion += 1;
  user.onboardingStep = STEP_ORDER_ADMIN[STEP_ORDER_ADMIN.indexOf(user.onboardingStep || 'password') + 1] || 'restaurant';
  await user.save();

  res.json({ message: 'Password changed', onboardingStep: user.onboardingStep });
});

export const updateRestaurantDetails = asyncHandler(async (req, res) => {
  const { name, location, contactInfo, logo } = req.body;
  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const restaurant = await Restaurant.findById(user.restaurantId);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

  if (name) restaurant.name = name;
  if (location !== undefined) restaurant.location = location;
  if (contactInfo !== undefined) restaurant.contactInfo = contactInfo;
  if (logo !== undefined) restaurant.logo = logo;

  await restaurant.save();

  const currentIndex = STEP_ORDER_ADMIN.indexOf(user.onboardingStep || 'restaurant');
  user.onboardingStep = STEP_ORDER_ADMIN[currentIndex + 1] || 'inventory';
  await user.save();

  res.json({ message: 'Restaurant details updated', onboardingStep: user.onboardingStep, restaurant });
});

export const markComplete = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: 'User not found' });

  user.onboarded = true;
  user.onboardingStep = 'complete';
  await user.save();

  res.json({ message: 'Onboarding complete', onboarded: true, onboardingStep: 'complete' });
});
