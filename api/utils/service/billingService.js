import Restaurant from '../models/Restaurant.js';
import Invoice from '../models/Invoice.js';
import BillingPayment from '../models/BillingPayment.js';
import BillingEvent from '../models/BillingEvent.js';
import { verifyTransaction } from '../utils/paystack.js';
import { addMonths, DAY } from '../utils/dates.js';
import { GRACE_DAYS } from '../utils/access.js';
import { sendBillingNotice } from './notify.js';

// Billing can use its own Paystack account; with one account it falls back to the main key
export const billingKey = () => process.env.BILLING_PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY;

export const logBilling = (restaurantId, type, by, data) =>
  BillingEvent.create({ restaurantId, type, by, data }).catch((e) => console.error('billing log failed:', e.message));

// The ONLY place a payment extends access. Every step is a conditional or repeatable update.
async function markInvoicePaid(payment, txnId) {
  const inv = await Invoice.findById(payment.invoiceId);

  // 1. open -> paid, fixing the exact period this payment buys (new time is added after any time still left)
  let invoice = null;
  if (inv?.status === 'open') {
    const restaurant = await Restaurant.findById(inv.restaurantId).select('accessUntil');
    const now = new Date();
    const periodStart = restaurant?.accessUntil > now ? restaurant.accessUntil : now;
    invoice = await Invoice.findOneAndUpdate(
      { _id: inv._id, status: 'open' },
      { status: 'paid', paidAt: now, paymentId: payment._id, periodStart, periodEnd: addMonths(periodStart, inv.months) },
      { new: true }
    );
  }
  // If we crashed after step 1 earlier, this finds our own paid invoice and simply finishes the job
  const settled = invoice ?? (await Invoice.findOne({ _id: payment.invoiceId, status: 'paid', paymentId: payment._id }));

  // 2. Payment record. Money arrived but the invoice was voided meanwhile: flag it for a human.
  await BillingPayment.updateOne(
    { _id: payment._id, status: 'pending' },
    { status: 'success', gatewayTxnId: txnId, verifiedAt: new Date(), ...(!settled && { flag: 'orphan' }) }
  );
  if (!settled) {
    await logBilling(payment.restaurantId, 'payment_flagged', 'system', { reference: payment.reference, flag: 'orphan' });
    return;
  }

  // 3. Extend access. $max makes this safe to repeat: it can never extend twice or shorten anything.
  await Restaurant.updateOne(
    { _id: settled.restaurantId },
    { $max: { accessUntil: settled.periodEnd }, $set: { planCode: settled.planCode, billingPeriod: settled.period, lastNotice: null } }
  );
  await logBilling(settled.restaurantId, 'payment_success', 'system', {
    invoice: settled.number, plan: settled.planCode, period: settled.period, until: settled.periodEnd, reference: payment.reference,
  });
}

// Asks Paystack directly and trusts only its answer, compared with what WE stored
export async function settleBilling(payment) {
  let d;
  try { d = await verifyTransaction(payment.reference, billingKey()); } catch { return; } // not ready: try again later

  if (d.status === 'success') {
    if (d.reference !== payment.reference || d.currency !== 'KES' || Number(d.amount) !== payment.amount) {
      await BillingPayment.updateOne({ _id: payment._id, status: 'pending' }, { status: 'flagged', flag: 'amount_mismatch' });
      await logBilling(payment.restaurantId, 'payment_flagged', 'system', { reference: payment.reference, flag: 'amount_mismatch' });
      return;
    }
    return markInvoicePaid(payment, String(d.id));
  }

  // 'abandoned' can show while a prompt is still open, so trust it only after the 180s window
  const ageMs = Date.now() - new Date(payment.createdAt).getTime();
  if (d.status === 'failed' || d.status === 'reversed' || (d.status === 'abandoned' && ageMs > 190_000)) {
    await BillingPayment.updateOne(
      { _id: payment._id, status: 'pending' },
      { status: 'failed', resultDesc: String(d.gateway_response || d.message || d.status).slice(0, 200) }
    );
  }
}

// Webhook entry point (signature already checked)
export async function handleBillingEvent(event) {
  if (event?.event !== 'charge.success') return;
  const ref = event.data?.reference;
  if (typeof ref !== 'string' || !ref.startsWith('sub-')) return;

  const payment = await BillingPayment.findOne({ reference: ref, status: 'pending' });
  if (payment) await settleBilling(payment);
}

// While the owner's page polls: at most one Paystack check per payment every 5 seconds
export async function reconcileBilling(payment) {
  const claimed = await BillingPayment.findOneAndUpdate(
    { _id: payment._id, status: 'pending', $or: [{ lastCheckedAt: null }, { lastCheckedAt: { $lt: new Date(Date.now() - 5000) } }] },
    { lastCheckedAt: new Date() }
  );
  if (claimed) await settleBilling(payment);
}

function noticeStage(r, now = Date.now()) {
  const until = new Date(r.accessUntil).getTime();
  if (now >= until + GRACE_DAYS * DAY) return 'blocked';
  if (now >= until) return 'grace';
  const daysLeft = Math.ceil((until - now) / DAY);
  return daysLeft <= 1 ? 't-1' : daysLeft <= 3 ? 't-3' : daysLeft <= 7 ? 't-7' : null;
}

// Every 10 minutes
export async function billingSweep() {
  // 1. Settle prompts whose webhook never arrived (the owner closed the page); give up on day-old ones
  const pending = await BillingPayment.find({ status: 'pending', createdAt: { $lt: new Date(Date.now() - 30_000) } }).limit(50);
  for (const p of pending) {
    if (Date.now() - new Date(p.createdAt).getTime() > DAY) {
      await BillingPayment.updateOne({ _id: p._id, status: 'pending' }, { status: 'failed', resultDesc: 'timed out' });
    } else {
      await settleBilling(p).catch((e) => console.error('billing settle failed:', e.message));
    }
  }

  // 2. Reminders, once per stage (lastNotice is reset on every payment)
  const soon = await Restaurant.find({
    isActive: true,
    accessUntil: { $gt: new Date(Date.now() - 30 * DAY), $lt: new Date(Date.now() + 8 * DAY) },
  });
  for (const r of soon) {
    const stage = noticeStage(r);
    if (!stage) continue;
    const claimed = await Restaurant.updateOne({ _id: r._id, lastNotice: { $ne: stage } }, { lastNotice: stage });
    if (claimed.modifiedCount) await sendBillingNotice(r, stage).catch((e) => console.error('notice failed:', e.message));
  }
}