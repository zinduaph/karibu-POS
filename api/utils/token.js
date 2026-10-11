import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken.js';

const REFRESH_TTL_MS = { admin: 7 * 24 * 3600e3, cashier: 12 * 3600e3 }; // cashier = about one shift
const COOKIE = 'rt';
const cookieBase = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAMESITE || 'strict',
  path: '/api/auth',
});

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const readRefreshCookie = (req) => req.cookies?.[COOKIE];
export const clearRefreshCookie = (res) => res.clearCookie(COOKIE, cookieBase());

export const signAccess = (user) =>
  jwt.sign(
    { sub: String(user._id), role: user.role, restaurantId: String(user.restaurantId), tv: user.tokenVersion },
    process.env.ACCESS_SECRET,
    { expiresIn: '15m', algorithm: 'HS256' }
  );

export async function issueRefresh(user, res, family = crypto.randomUUID()) {
  const raw = crypto.randomBytes(48).toString('hex');
  const ttl = REFRESH_TTL_MS[user.role];
  await RefreshToken.create({ userId: user._id, tokenHash: sha256(raw), family, expiresAt: new Date(Date.now() + ttl) });
  res.cookie(COOKIE, raw, { ...cookieBase(), maxAge: ttl });
}

export const revokeAllForUser = (userId) =>
  RefreshToken.updateMany({ userId, revokedAt: { $exists: false } }, { revokedAt: new Date() });