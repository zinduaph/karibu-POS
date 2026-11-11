import jwt from 'jsonwebtoken';
import RefreshToken from '../models/refreshToken.js';
import User from '../models/cashier.js';
import { sha256 } from '../utils/token.js';
 import Restaurant from '../models/resturant.js';
import { accessState } from '../utils/access.js';

async function loadUser(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) return null;
  return user;
}

function setReqUser(req, user) {
  req.user = {
    id: user._id,
    role: user.role,
    restaurantId: user.restaurantId,
    name: user.name,
    mustChangePin: user.mustChangePin === true,
    onboarded: user.onboarded === true,
  };
}

function isOnboardingExemptPath(path) {
  return [
    '/api/auth/change-pin',
    '/api/auth/cashier/register',
    '/api/auth/logout',
    '/api/auth/refresh',
    '/api/auth/me',
  ].some((exempt) => path === exempt || path.startsWith(exempt + '/'));
}

function onboardingBlocked(user, path) {
  const isBlocked = user.role === 'cashier' && user.mustChangePin === true;
  return isBlocked && !isOnboardingExemptPath(path);
}

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (token) {
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN, {
        algorithms: ['HS256'],
      });
      const user = await loadUser(payload.sub);
      if (!user || user.tokenVersion !== payload.tv) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      setReqUser(req, user);
      if (onboardingBlocked(user, req.originalUrl.split('?')[0])) {
        const body = user.role === 'admin'
          ? { message: 'Onboarding required', code: 'ONBOARDING_REQUIRED' }
          : { message: 'PIN change required', code: 'PIN_CHANGE_REQUIRED' };
        return res.status(403).json(body);
      }
      // restaurant active + subscription check
      const restaurant = await Restaurant.findById(user.restaurantId).select('isActive accessUntil');
      if (!restaurant?.isActive) return res.status(401).json({ message: 'Unauthorized' }); // switched off: nothing works
      if (accessState(restaurant) === 'expired' && !allowedWhenExpired(req, user.role)) {
        return res.status(402).json({ code: 'SUBSCRIPTION_EXPIRED', message: "This restaurant's subscription has ended." });
      }
      return next();
    }

    const raw = req.cookies?.['rt'];
    if (!raw) return res.status(401).json({ message: 'No refresh token cookie' });

    const doc = await RefreshToken.findOne({ tokenHash: sha256(raw) });
    if (!doc || doc.revokedAt) return res.status(401).json({ message: 'Invalid refresh token' });
    if (doc.expiresAt < new Date()) return res.status(401).json({ message: 'Refresh token expired' });

    const user = await loadUser(doc.userId);
    if (!user) return res.status(401).json({ message: 'User not found or inactive' });

    setReqUser(req, user);
    if (onboardingBlocked(user, req.originalUrl.split('?')[0])) {
      const body = user.role === 'admin'
        ? { message: 'Onboarding required', code: 'ONBOARDING_REQUIRED' }
        : { message: 'PIN change required', code: 'PIN_CHANGE_REQUIRED' };
      return res.status(403).json(body);
    }
    // restaurant active + subscription check
    const restaurant = await Restaurant.findById(user.restaurantId).select('isActive accessUntil');
    if (!restaurant?.isActive) return res.status(401).json({ message: 'Unauthorized' }); // switched off: nothing works
    if (accessState(restaurant) === 'expired' && !allowedWhenExpired(req, user.role)) {
      return res.status(402).json({ code: 'SUBSCRIPTION_EXPIRED', message: "This restaurant's subscription has ended." });
    }
    next();
  } catch (e) {
    res.status(401).json({ message: 'Authentication error' });
  }
}

export function authenticateDeveloper(req, res, next) {
  const secret = process.env.DEV_JWT_SECRET;
  if (!secret) {
    return res.status(503).json({ message: 'Developer authentication is not configured' });
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (payload.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = { role: 'developer' };
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// What an EXPIRED restaurant may still do
function allowedWhenExpired(req, role) {
  const path = req.originalUrl.split('?')[0];
  if (path.startsWith('/api/auth/')) return true;     // log out, refresh, who-am-I
  if (role !== 'admin') return false;                 // cashiers: nothing else
  if (path.startsWith('/api/billing')) return true;   // the admin can pay
  return req.method === 'GET' && (path === '/api/restaurant' || path.startsWith('/api/reports/')); // and read their data
}

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Forbidden' });
