import Restaurant from '../models/resturant.js';
import { addMonths } from './dates.js';

const DAY = 86_400_000;
const GRACE_DAYS = 7;

export const GRACE_DAYS_CONST = GRACE_DAYS;

export function daysUntil(ms) {
  return Math.max(0, Math.ceil((ms - Date.now()) / DAY));
}

export function accessState(restaurant, now = Date.now()) {
  if (!restaurant?.isActive || !restaurant.accessUntil) return 'expired';
  const until = new Date(restaurant.accessUntil).getTime();
  if (now < until) return 'active';
  if (now < until + GRACE_DAYS * DAY) return 'grace';
  return 'expired';
}

export function isSubscribed(restaurant) {
  if (!restaurant) return false;
  const until = restaurant.accessUntil ? new Date(restaurant.accessUntil).getTime() : 0;
  return until > Date.now();
}

export function subscriptionStatus(restaurant) {
  if (!restaurant) return { active: false, days: 0, plan: null, period: null, message: 'No restaurant' };
  const until = restaurant.accessUntil ? new Date(restaurant.accessUntil).getTime() : 0;
  const days = daysUntil(until);
  const active = days > 0;
  return {
    active,
    days,
    plan: restaurant.planCode || null,
    period: restaurant.billingPeriod || null,
    accessUntil: restaurant.accessUntil || null,
    message: active ? 'Active subscription' : days === 0 ? 'Expired today' : 'Expired',
  };
}

export function trialStatus(restaurant) {
  if (!restaurant) return { active: false, days: 0 };
  const created = restaurant.createdAt ? new Date(restaurant.createdAt).getTime() : Date.now();
  const trialEnd = created + 30 * DAY;
  const days = daysUntil(trialEnd);
  return { active: days > 0, days };
}

export async function requireActiveSubscription(req, res, next) {
  const restaurant = await Restaurant.findById(req.user.restaurantId);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

  const sub = subscriptionStatus(restaurant);
  const trial = trialStatus(restaurant);

  if (sub.active || trial.active) {
    req.subscription = { ...sub, trial };
    return next();
  }

  return res.status(403).json({
    message: 'Subscription expired. Please renew to continue using the POS.',
    code: 'SUBSCRIPTION_EXPIRED',
    plan: sub.plan,
    days: sub.days,
  });
}

export async function extendAccess(restaurantId, plan, period) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new Error('Restaurant not found');

  const now = new Date();
  const start = restaurant.accessUntil && new Date(restaurant.accessUntil).getTime() > now.getTime()
    ? new Date(restaurant.accessUntil)
    : now;
  const end = period === 'yearly' ? addMonths(start, 12) : addMonths(start, 1);

  restaurant.accessUntil = end;
  restaurant.planCode = plan;
  restaurant.billingPeriod = period;
  await restaurant.save();

  return { accessUntil: end, plan, period };
}
