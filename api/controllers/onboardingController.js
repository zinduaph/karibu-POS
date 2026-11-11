import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/cashier.js';
import MenuItem from '../models/menuItem.js';

export const markComplete = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: 'User not found' });

  const menuItemCount = await MenuItem.countDocuments({ restaurantId: user.restaurantId, isAvailable: true });
  if (menuItemCount === 0) {
    return res.status(400).json({ message: 'At least one available menu item is required before completing onboarding.' });
  }

  const cashierCount = await User.countDocuments({ restaurantId: user.restaurantId, role: 'cashier', isActive: true });
  if (cashierCount === 0) {
    return res.status(400).json({ message: 'At least one active cashier is required before completing onboarding.' });
  }

  user.onboarded = true;
  user.onboardingStep = 'complete';
  await user.save();

  res.json({ message: 'Onboarding complete', onboarded: true, onboardingStep: 'complete' });
});
