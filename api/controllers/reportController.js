import Sale from '../models/sales.js';
import asyncHandler from '../utils/asyncHandler.js';

const TZ = 'Africa/Nairobi';
const OFFSET = '+03:00';
const DAY = 86_400_000;

const round2 = (n) => Math.round((n ?? 0) * 100) / 100;
const ymd = (ms) => new Date(ms).toISOString().slice(0, 10);
const addDays = (s, n) => ymd(Date.parse(`${s}T00:00:00Z`) + n * DAY);
const startOf = (s) => new Date(`${s}T00:00:00${OFFSET}`);
const todayKE = () => ymd(Date.now() + 3 * 3600e3);
const pct = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);
const methodSum = (m) => ({ $sum: { $cond: [{ $eq: ['$paymentMethod', m] }, '$totalAmount', 0] } });
const mpesaSum = { $sum: { $cond: [{ $in: ['$paymentMethod', ['mpesa', 'mpesa_till']] }, '$totalAmount', 0] } };

export const overview = asyncHandler(async (req, res) => {
  const to = req.query.to ?? todayKE();
  const from = req.query.from ?? addDays(to, -29);
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY + 1;

  const start = startOf(from);
  const end = startOf(addDays(to, 1));
  const prevStart = startOf(addDays(from, -days));

  const current = { createdAt: { $gte: start, $lt: end } };
  const paidNow = { paymentStatus: 'completed', ...current };

  const [r] = await Sale.aggregate([
    {
      $match: {
        restaurantId: req.user.restaurantId,
        createdAt: { $gte: prevStart, $lt: end },
        paymentStatus: { $in: ['completed', 'failed', 'pending'] },
      },
    },
    {
      $facet: {
        kpis: [
          { $match: paidNow },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 }, items: { $sum: { $sum: '$items.quantity' } } } },
        ],
        prev: [
          { $match: { paymentStatus: 'completed', createdAt: { $gte: prevStart, $lt: start } } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        ],
        voided: [
          { $match: { paymentStatus: 'failed', ...current } },
          { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$totalAmount' } } },
        ],
        daily: [
          { $match: paidNow },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } },
              revenue: { $sum: '$totalAmount' },
              orders: { $sum: 1 },
              cash: methodSum('cash'),
              mpesa: mpesaSum,
            },
          },
        ],
        byMethod: [
          { $match: paidNow },
          { $group: { _id: '$paymentMethod', revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        ],
        topItems: [
          { $match: paidNow },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.name',
              name: { $first: '$items.name' },
              qty: { $sum: '$items.quantity' },
              revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 10 },
        ],
        byHour: [
          { $match: paidNow },
          { $group: { _id: { $hour: { date: '$createdAt', timezone: TZ } }, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        ],
      },
    },
  ]);

  const dailyMap = new Map(r.daily.map((d) => [d._id, d]));
  const daily = Array.from({ length: days }, (_, i) => {
    const date = addDays(from, i);
    const d = dailyMap.get(date);
    return { date, revenue: round2(d?.revenue), orders: d?.orders ?? 0, cash: round2(d?.cash), mpesa: round2(d?.mpesa) };
  });
  const hourMap = new Map(r.byHour.map((h) => [h._id, h]));
  const byHour = Array.from({ length: 24 }, (_, hour) => ({
    hour, orders: hourMap.get(hour)?.orders ?? 0, revenue: round2(hourMap.get(hour)?.revenue),
  }));

  const k = r.kpis[0] ?? {};
  const p = r.prev[0] ?? {};
  const v = r.voided[0] ?? {};
  const revenue = round2(k.revenue);
  const orders = k.orders ?? 0;

  res.json({
    range: { from, to, days },
    kpis: {
      revenue,
      orders,
      avgOrder: orders ? round2(revenue / orders) : 0,
      itemsSold: k.items ?? 0,
      voidedCount: v.count ?? 0,
      voidedValue: round2(v.value),
      revenueChange: pct(revenue, p.revenue ?? 0),
      ordersChange: pct(orders, p.orders ?? 0),
    },
    daily,
    byMethod: r.byMethod.map((m) => ({ method: m._id, revenue: round2(m.revenue), orders: m.orders })),
    byCashier: [],
    topItems: r.topItems.map((i) => ({ name: i.name, qty: i.qty, revenue: round2(i.revenue) })),
    byHour,
    unpaid: [],
  });
});
