import { Router } from 'express';
import Restaurant from '../models/resturant.js';
import Sale from '../models/sales.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateDeveloper } from '../middleware/auth.js';

const router = Router();
const activity = [];
const ACTIVITY_LIMIT = 100;
const MONTHS_TO_SHOW = 12;

export function monitorRequests(req, res, next) {
  res.on('finish', () => {
    if (![401, 403, 429].includes(res.statusCode)) return;
    activity.unshift({
      time: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      ip: req.ip,
    });
    if (activity.length > ACTIVITY_LIMIT) activity.pop();
  });
  next();
}

router.use(authenticateDeveloper);

router.get('/hostels', asyncHandler(async (_req, res) => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - MONTHS_TO_SHOW + 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const monthKeys = Array.from({ length: MONTHS_TO_SHOW }, (_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    return date.toISOString().slice(0, 7);
  });

  const [hostels, monthlySales] = await Promise.all([
    Restaurant.find().select('name createdAt isActive').sort({ createdAt: -1 }).lean(),
    Sale.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          restaurantId: { $type: 'objectId' },
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: {
            restaurantId: '$restaurantId',
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } },
          },
          salesCount: { $sum: 1 },
          salesTotal: { $sum: '$totalAmount' },
        },
      },
    ]),
  ]);

  const salesByHostel = new Map();
  for (const sale of monthlySales) {
    const hostelId = sale._id.restaurantId.toString();
    if (!salesByHostel.has(hostelId)) salesByHostel.set(hostelId, new Map());
    salesByHostel.get(hostelId).set(sale._id.month, {
      month: sale._id.month,
      salesCount: sale.salesCount,
      salesTotal: sale.salesTotal,
    });
  }

  res.json({
    months: monthKeys,
    hostels: hostels.map((hostel) => {
      const byMonth = salesByHostel.get(hostel._id.toString());
      return {
        id: hostel._id,
        name: hostel.name,
        createdAt: hostel.createdAt,
        isActive: hostel.isActive,
        monthlySales: monthKeys.map((month) => byMonth?.get(month) ?? {
          month,
          salesCount: 0,
          salesTotal: 0,
        }),
      };
    }),
  });
}));

router.get('/health', (_req, res) => {
  const databaseConnected = Restaurant.db.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ok' : 'degraded',
    database: databaseConnected ? 'connected' : 'disconnected',
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

router.get('/activity', (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(requestedLimit, ACTIVITY_LIMIT))
    : 50;
  res.json({ events: activity.slice(0, limit) });
});

export default router;