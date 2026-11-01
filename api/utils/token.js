import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/refreshToken.js';

const REFRESH_TTL_MS = { admin: 7 * 24 * 3600e3, cashier: 12 * 3600e3 };
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

export const signAccess = (user, role) =>
  jwt.sign(
    { sub: String(user._id), role, restaurantId: String(user.restaurantId), tv: user.tokenVersion },
    process.env.ACCESS_TOKEN,
    { expiresIn: '15m', algorithm: 'HS256' }
  );

export async function issueRefresh(user, res, role, family = crypto.randomUUID()) {
  const raw = crypto.randomBytes(48).toString('hex');
  const ttl = REFRESH_TTL_MS[role];
  await RefreshToken.create({ userId: user._id, userModel: user.constructor.modelName, tokenHash: sha256(raw), family, expiresAt: new Date(Date.now() + ttl) });
  res.cookie(COOKIE, raw, { ...cookieBase(), maxAge: ttl });
}

export const revokeAllForUser = (userId, userModel) =>
  RefreshToken.updateMany({ userId, userModel, revokedAt: { $exists: false } }, { revokedAt: new Date() });
