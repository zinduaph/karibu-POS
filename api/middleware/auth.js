import jwt from 'jsonwebtoken';
import RefreshToken from '../models/refreshToken.js';
import { sha256 } from '../utils/token.js';
import User from '../models/user.js';

const JWT_SECRET = process.env.ACCESS_SECRET;

export const authenticate = async (req, res, next) => {
  try {
    const raw = req.cookies?.['rt'];
    if (!raw) return res.status(401).json({ message: 'No refresh token' });

    const doc = await RefreshToken.findOne({ tokenHash: sha256(raw) });
    if (!doc || doc.revokedAt) return res.status(401).json({ message: 'Invalid refresh token' });
    if (doc.expiresAt < new Date()) return res.status(401).json({ message: 'Refresh token expired' });

    const user = await User.findById(doc.userId);
    if (!user || !user.isActive) return res.status(401).json({ message: 'User not found or inactive' });

    req.user = { id: user._id, role: user.role, restaurantId: user.restaurantId };
    next();
  } catch (e) {
    res.status(401).json({ message: 'Authentication error' });
  }
};

export const requireRole = (allowedRole) => {
  return (req, res, next) => {
    if (req.user.role !== allowedRole) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  };
};