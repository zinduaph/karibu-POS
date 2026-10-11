import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const p = jwt.verify(token, process.env.ACCESS_SECRET, { algorithms: ['HS256'] });

    // DB check on every request, so deactivating or force-logging-out a user works instantly
    const user = await User.findOne({ _id: p.sub, isActive: true })
      .select('role restaurantId tokenVersion name mustChangePin');
    if (!user || user.tokenVersion !== p.tv) return res.status(401).json({ message: 'Unauthorized' });

    // A cashier still on the PIN the admin chose can only use /api/auth/* (to change it)
    if (user.mustChangePin && !req.originalUrl.startsWith('/api/auth/')) {
      return res.status(403).json({ message: 'PIN change required', code: 'PIN_CHANGE_REQUIRED' });
    }

    // restaurantId comes from the DB record, NEVER from the request body or query
    req.user = { id: String(user._id), role: user.role, restaurantId: user.restaurantId, name: user.name };
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Forbidden' });