import Restaurant from '../models/resturant.js';
import Invoice from '../models/invoice.js';
import Subscription from '../models/Subscription.js';
import BillingEvent from '../models/BillingEvent.js';
import BillingPayment from '../models/billingPayment.js';
import { addMonths } from '../utils/dates.js';
import { reconcilePayheroPayment } from './payheroBilling.service.js';

const GRACE_DAYS = 7;
const REMINDER_DAYS = [7, 3, 1];

export async function billingSweep() {
  const now = new Date();

  const pendingPayments = await BillingPayment.find({
    status: 'pending',
    $or: [
      { gatewayTxnId: { $exists: true, $ne: '' } },
      { statusLookupReference: { $exists: true, $ne: '' } },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(50)
    .select('_id');
  for (const payment of pendingPayments) {
    try {
      await reconcilePayheroPayment(payment._id);
    } catch (error) {
      console.error('PayHero payment reconciliation failed:', error.message);
    }
  }

  // Expire subscriptions whose accessUntil has passed
  const expired = await Restaurant.find({
    accessUntil: { $lt: now, $exists: true },
    $or: [{ planCode: { $exists: true, $ne: null } }, { billingPeriod: { $exists: true, $ne: null } }],
  });

  for (const restaurant of expired) {
    restaurant.planCode = null;
    restaurant.billingPeriod = null;
    await restaurant.save();

    await BillingEvent.create({
      restaurantId: restaurant._id,
      type: 'expired',
      by: 'system',
      data: { planCode: restaurant.planCode, accessUntil: restaurant.accessUntil },
    });
  }

  // Void open invoices past due date + grace period
  const dueCutoff = new Date(Date.now() - GRACE_DAYS * 86_400_000);
  const overdue = await Invoice.find({ status: 'open', dueAt: { $lt: dueCutoff } });
  for (const invoice of overdue) {
    invoice.status = 'voided';
    await invoice.save();
    await BillingEvent.create({
      restaurantId: invoice.restaurantId,
      type: 'payment_flagged',
      by: 'system',
      data: { invoiceId: invoice._id, reason: 'invoice_overdue' },
    });
  }

  // Send reminders for subscriptions expiring soon
  for (const days of REMINDER_DAYS) {
    const target = new Date(Date.now() + days * 86_400_000);
    const start = new Date(target.getTime() - 86_400_000 / 24); // within a day window
    const expiring = await Restaurant.find({
      accessUntil: { $gte: start, $lte: target, $exists: true },
      planCode: { $exists: true, $ne: null },
    });
    for (const restaurant of expiring) {
      if (restaurant.lastNotice === String(days)) continue;
      restaurant.lastNotice = String(days);
      await restaurant.save();
      await BillingEvent.create({
        restaurantId: restaurant._id,
        type: 'payment_flagged',
        by: 'system',
        data: { reminderDays: days, accessUntil: restaurant.accessUntil },
      });
    }
  }

  return { expired: expired.length, voided: overdue.length };
}

export async function createSubscription(restaurantId, plan, period, reference) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new Error('Restaurant not found');

  const now = new Date();
  const start = restaurant.accessUntil && new Date(restaurant.accessUntil).getTime() > now.getTime()
    ? new Date(restaurant.accessUntil)
    : now;
  const end = period === 'yearly' ? addMonths(start, 12) : addMonths(start, 1);

  const subscription = await Subscription.create({
    restaurantId,
    plan,
    period,
    status: 'active',
    currentPeriodStart: start,
    currentPeriodEnd: end,
  });

  restaurant.accessUntil = end;
  restaurant.planCode = plan;
  restaurant.billingPeriod = period;
  await restaurant.save();

  await BillingEvent.create({
    restaurantId,
    type: 'payment_success',
    by: 'system',
    data: { plan, period, reference, subscriptionId: subscription._id },
  });

  return subscription;
}
