import mongoose from 'mongoose';
import crypto from 'node:crypto';
import Restaurant from '../models/resturant.js';
import Invoice from '../models/invoice.js';
import BillingEvent from '../models/BillingEvent.js';
import BillingPayment from '../models/billingPayment.js';
import { getPayheroConfig, initiatePayheroStkPush, PayHeroApiError } from '../utils/payhero.js';
import { priceFor, PLANS } from '../config/plans.js';
import asyncHandler from '../utils/asyncHandler.js';
import { handlePayheroCallback, reconcilePayheroPayment } from '../services/payheroBilling.service.js';

export const webhook = asyncHandler(async (req, res) => {
  const result = await handlePayheroCallback(req.body);
  if (result.invalid) return res.status(400).json({ message: 'Invalid PayHero callback payload.' });
  return res.status(200).json({ received: true });
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
  try {
    getPayheroConfig();
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }

  const { plan, period, phone } = req.body;
  const amount = priceFor(plan, period);
  if (!amount) return res.status(400).json({ message: 'Invalid plan or period' });

  const restaurant = await Restaurant.findById(req.user.restaurantId);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

  const activePayment = await BillingPayment.findOne({
    restaurantId: restaurant._id,
    status: { $in: ['pending', 'flagged'] },
  }).select('status');
  if (activePayment) {
    return res.status(409).json({
      message: activePayment.status === 'flagged'
        ? 'A previous payment needs support review before another payment can be started.'
        : 'An M-Pesa payment is already pending for this restaurant.',
    });
  }

  const invoice = await Invoice.create({
    restaurantId: restaurant._id,
    plan,
    period,
    amount,
    reference: `sub-${crypto.randomUUID()}`,
    dueAt: new Date(Date.now() + 24 * 3600e3),
  });

  let payment;
  try {
    payment = await BillingPayment.create({
      restaurantId: restaurant._id,
      invoiceId: invoice._id,
      reference: invoice.reference,
      amount,
      phone,
      status: 'pending',
    });
  } catch (error) {
    if (error.code === 11000) {
      await Invoice.updateOne({ _id: invoice._id, status: 'open' }, { $set: { status: 'voided' } });
      return res.status(409).json({ message: 'An M-Pesa payment is already pending for this restaurant.' });
    }
    throw error;
  }

  let initialized;
  try {
    initialized = await initiatePayheroStkPush({
      amount,
      phoneNumber: phone,
      externalReference: invoice.reference,
      customerName: restaurant.name,
    });
  } catch (error) {
    const uncertain = error instanceof PayHeroApiError && error.uncertain;
    await BillingPayment.updateOne(
      { _id: payment._id, status: 'pending' },
      {
        $set: {
          status: uncertain ? 'flagged' : 'failed',
          ...(uncertain && { flag: 'initialization_uncertain' }),
          resultDesc: error.message.slice(0, 200),
        },
      },
    );
    if (!uncertain) {
      await Invoice.updateOne({ _id: invoice._id, status: 'open' }, { $set: { status: 'voided' } });
    }
    await BillingEvent.create({
      restaurantId: restaurant._id,
      type: 'payment_flagged',
      by: 'system',
      data: {
        reference: invoice.reference,
        reason: uncertain ? 'payhero_initialization_uncertain' : 'payhero_initialization_rejected',
      },
    });
    if (uncertain) {
      return res.status(202).json({ reference: invoice.reference, status: 'flagged' });
    }
    return res.status(502).json({ message: error.message });
  }

  await BillingPayment.updateOne(
    { _id: payment._id, status: 'pending' },
    {
      $set: {
        gatewayTxnId: initialized.reference,
        ...(typeof initialized.CheckoutRequestID === 'string' && { gatewayRequestId: initialized.CheckoutRequestID }),
      },
    },
  );

  return res.status(202).json({ reference: invoice.reference, status: 'pending' });
});

export const invoiceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { reference: id };
  let invoice = await Invoice.findOne(query);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  if (invoice.restaurantId.toString() !== String(req.user.restaurantId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  let payment = await BillingPayment.findOne({ invoiceId: invoice._id });
  if (payment?.status === 'pending') {
    await reconcilePayheroPayment(payment._id);
    invoice = await Invoice.findById(invoice._id);
    payment = await BillingPayment.findById(payment._id);
  }

  return res.json({
    status: invoice.status,
    paymentStatus: payment?.status || null,
    paymentMessage: payment?.resultDesc || null,
    amount: invoice.amount,
    dueAt: invoice.dueAt,
    paidAt: invoice.paidAt,
  });
});
