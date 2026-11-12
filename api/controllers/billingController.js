import mongoose from 'mongoose';
import crypto from 'crypto';
import Restaurant from '../models/resturant.js';
import Invoice from '../models/invoice.js';
import Subscription from '../models/Subscription.js';
import BillingEvent from '../models/BillingEvent.js';
import { initializeMobileMoneyTransaction, verifyTransaction, hasPaystackConfig } from '../utils/paystack.js';
import { priceFor, PLANS } from '../config/plans.js';
import { extendAccess } from '../utils/access.js';
import asyncHandler from '../utils/asyncHandler.js';

export const webhook = asyncHandler(async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!Buffer.isBuffer(req.rawBody)) {
    console.error('[paystack webhook] Raw request body unavailable');
    return res.status(400).json({ message: 'Invalid webhook payload' });
  }
  const signature = req.headers['x-paystack-signature'];
  const hash = crypto
    .createHmac('sha512', secret)
    .update(req.rawBody)
    .digest('hex');

  if (
    typeof signature !== 'string' ||
    signature.length !== hash.length ||
    !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
  ) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const event = req.body.event;
  const data = req.body.data || {};
  const reference = data.reference;
  const status = data.status;

  if (event === 'charge.success' && reference) {
    const invoice = await Invoice.findOne({ reference });
    if (!invoice) {
      await BillingEvent.create({
        restaurantId: null,
        type: 'payment_flagged',
        by: 'system',
        data: { reason: 'invoice_not_found', reference, status },
      });
      return res.status(200).json({ received: true });
    }

    if (invoice.status === 'paid') return res.status(200).json({ received: true });

    // Re-verify with Paystack before trusting the webhook
    const verified = await verifyTransaction(reference);
    if (verified.status !== 'success') {
      invoice.status = 'failed';
      await invoice.save();
      return res.status(200).json({ received: true });
    }

    const amountMatch = verified.amount === invoice.amount * 100; // Paystack uses kobo/cents
    if (!amountMatch) {
      invoice.status = 'failed';
      await invoice.save();
      await BillingEvent.create({
        restaurantId: invoice.restaurantId,
        type: 'payment_flagged',
        by: 'system',
        data: { reason: 'amount_mismatch', reference, expected: invoice.amount, got: verified.amount / 100 },
      });
      return res.status(200).json({ received: true });
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    invoice.gatewayTxnId = verified.id;
    await invoice.save();

    await extendAccess(invoice.restaurantId, invoice.plan, invoice.period);

    await Subscription.create({
      restaurantId: invoice.restaurantId,
      plan: invoice.plan,
      period: invoice.period,
      status: 'active',
      currentPeriodStart: invoice.paidAt,
      currentPeriodEnd: new Date(
        invoice.period === 'yearly'
          ? new Date(invoice.paidAt).setFullYear(new Date(invoice.paidAt).getFullYear() + 1)
          : new Date(invoice.paidAt).setMonth(new Date(invoice.paidAt).getMonth() + 1)
      ),
      metadata: { invoiceId: invoice._id, reference },
    });

    await BillingEvent.create({
      restaurantId: invoice.restaurantId,
      type: 'payment_success',
      by: 'system',
      data: { reference, plan: invoice.plan, period: invoice.period, amount: invoice.amount },
    });
  }

  res.status(200).json({ received: true });
});

export const getBilling = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.user.restaurantId);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

  const invoices = await Invoice.find({ restaurantId: restaurant._id })
    .sort({ createdAt: -1 })
    .limit(20);

  const status = {
    active: Boolean(restaurant.accessUntil && new Date(restaurant.accessUntil).getTime() > Date.now()),
    plan: restaurant.planCode || null,
    period: restaurant.billingPeriod || null,
    accessUntil: restaurant.accessUntil || null,
  };

  res.json({ status, invoices, plans: Object.entries(PLANS).map(([code, p]) => ({ code, ...p })) });
});

export const checkout = asyncHandler(async (req, res) => {
  if (!hasPaystackConfig()) {
    return res.status(501).json({ message: 'Paystack is not configured on the server.' });
  }

  const { plan, period, phone } = req.body;
  const amount = priceFor(plan, period);
  if (!amount) return res.status(400).json({ message: 'Invalid plan or period' });

  const restaurant = await Restaurant.findById(req.user.restaurantId);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

  const reference = `sub-${restaurant._id}-${Date.now()}`;
  const dueAt = new Date(Date.now() + 24 * 3600e3);

  const invoice = await Invoice.create({
    restaurantId: restaurant._id,
    plan,
    period,
    amount,
    reference,
    dueAt,
  });

  const user = restaurant;
  const email = user.email || `${user.name.replace(/\s+/g, '.').toLowerCase()}@example.com`;

  const initialized = await initializeMobileMoneyTransaction({
    email,
    amount: amount * 100, // Paystack uses kobo/cents
    reference,
    callbackUrl: `${process.env.CLIENT_APP_URL || 'https://admin.qicksale.co.ke'}/billing/callback`,
    phone,
    metadata: { invoiceId: invoice._id, plan, period, restaurantId: restaurant._id },
  });

  res.json({
    reference,
    amount,
    authorizationUrl: initialized.authorization_url,
    accessCode: initialized.access_code,
  });
});

export const invoiceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { reference: id };
  const invoice = await Invoice.findOne(query);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  if (invoice.restaurantId.toString() !== req.user.restaurantId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.json({ status: invoice.status, amount: invoice.amount, dueAt: invoice.dueAt, paidAt: invoice.paidAt });
});
