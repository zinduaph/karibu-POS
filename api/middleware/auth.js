import RefreshToken from '../models/refreshToken.js';
import User from '../models/user.js';
import { sha256 } from '../utils/token.js';

export async function authenticate(req, res, next) {
  try {
    const raw = req.cookies?.['rt'];
    if (!raw) return res.status(401).json({ message: 'No refresh token cookie' });

    const doc = await RefreshToken.findOne({ tokenHash: sha256(raw) });
    if (!doc || doc.revokedAt) return res.status(401).json({ message: 'Invalid refresh token' });
    if (doc.expiresAt < new Date()) return res.status(401).json({ message: 'Refresh token expired' });

    const user = await User.findById(doc.userId);
    if (!user || !user.isActive) return res.status(401).json({ message: 'User not found or inactive' });

    req.user = { id: user._id, role: user.role, restaurantId: user.restaurantId, name: user.name };
    next();
  } catch (e) {
    res.status(401).json({ message: 'Authentication error' });
  }
}

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Forbidden' });