import BillingEvent from '../models/BillingEvent.js';
import BillingPayment from '../models/billingPayment.js';
import Invoice from '../models/invoice.js';
import Restaurant from '../models/resturant.js';
import Subscription from '../models/Subscription.js';
import { addMonths } from '../utils/dates.js';
import { getPayheroTransactionStatus } from '../utils/payhero.js';

const STATUS_CHECK_INTERVAL_MS = 5_000;

async function flagPayment(payment, flag, details = {}) {
  const result = await BillingPayment.updateOne(
    { _id: payment._id, status: 'pending' },
    { $set: { status: 'flagged', flag, resultDesc: flag } },
  );
  if (result.modifiedCount) {
    await BillingEvent.create({
      restaurantId: payment.restaurantId,
      type: 'payment_flagged',
      by: 'system',
      data: { reference: payment.reference, flag, ...details },
    });
  }
}

async function failPayment(payment, reason) {
  const result = await BillingPayment.updateOne(
    { _id: payment._id, status: 'pending' },
    { $set: { status: 'failed', resultDesc: String(reason).slice(0, 200) } },
  );
  if (result.modifiedCount) {
    await Invoice.updateOne(
      { _id: payment.invoiceId, status: 'open' },
      { $set: { status: 'voided' } },
    );
  }
}

async function settlePayment(payment, verified) {
  const expectedGatewayReference = payment.gatewayTxnId || verified.reference;
  const referenceMatches = payment.gatewayTxnId
    ? verified.reference === payment.gatewayTxnId
    : verified.reference === payment.statusLookupReference ||
      verified.provider_reference === payment.statusLookupReference ||
      verified.third_party_reference === payment.statusLookupReference;
  if (!referenceMatches) {
    await flagPayment(payment, 'transaction_reference_mismatch');
    return;
  }

  const hasVerifiedAmount = verified.amount !== undefined && verified.amount !== null;
  const verifiedAmount = hasVerifiedAmount ? Number(verified.amount) : null;
  const callbackAmount = payment.callbackAmount === undefined ? null : Number(payment.callbackAmount);
  if (hasVerifiedAmount && !Number.isSafeInteger(verifiedAmount)) {
    await flagPayment(payment, 'amount_invalid');
    return;
  }
  if (verifiedAmount !== null && callbackAmount !== null && verifiedAmount !== callbackAmount) {
    await flagPayment(payment, 'amount_mismatch', { expected: payment.amount, verified: verifiedAmount, callback: callbackAmount });
    return;
  }

  const amount = verifiedAmount ?? callbackAmount;
  if (amount === null) return;
  if (!Number.isSafeInteger(amount) || amount !== payment.amount) {
    await flagPayment(payment, 'amount_mismatch', {
      expected: payment.amount,
      received: amount,
    });
    return;
  }

  let invoice = await Invoice.findById(payment.invoiceId);
  if (!invoice) {
    await flagPayment(payment, 'invoice_not_found');
    return;
  }

  if (invoice.status === 'open') {
    const restaurant = await Restaurant.findById(invoice.restaurantId).select('accessUntil');
    if (!restaurant) {
      await flagPayment(payment, 'restaurant_not_found');
      return;
    }

    const now = new Date();
    const periodStart = restaurant.accessUntil && restaurant.accessUntil > now
      ? restaurant.accessUntil
      : now;
    const periodEnd = addMonths(periodStart, invoice.period === 'yearly' ? 12 : 1);
    invoice = await Invoice.findOneAndUpdate(
      { _id: invoice._id, status: 'open' },
      {
        $set: {
          status: 'paid',
          paidAt: now,
          gatewayTxnId: expectedGatewayReference,
          periodStart,
          periodEnd,
        },
      },
      { new: true },
    );
    if (!invoice) invoice = await Invoice.findById(payment.invoiceId);
  }

  if (
    invoice?.status !== 'paid' ||
    invoice.gatewayTxnId !== expectedGatewayReference ||
    !invoice.periodStart ||
    !invoice.periodEnd
  ) {
    await flagPayment(payment, 'invoice_not_settleable');
    return;
  }

  const accessUpdate = await Restaurant.updateOne(
    { _id: invoice.restaurantId },
    {
      $max: { accessUntil: invoice.periodEnd },
      $set: { planCode: invoice.plan, billingPeriod: invoice.period, lastNotice: null },
    },
  );
  if (!accessUpdate.matchedCount) {
    await flagPayment(payment, 'restaurant_not_found');
    return;
  }

  await Subscription.findOneAndUpdate(
    { invoiceId: invoice._id },
    {
      $setOnInsert: {
        invoiceId: invoice._id,
        restaurantId: invoice.restaurantId,
        plan: invoice.plan,
        period: invoice.period,
        status: 'active',
        currentPeriodStart: invoice.periodStart,
        currentPeriodEnd: invoice.periodEnd,
        metadata: { reference: payment.reference },
      },
    },
    { upsert: true },
  );

  const result = await BillingPayment.updateOne(
    { _id: payment._id, status: 'pending' },
    {
      $set: {
        status: 'success',
        gatewayTxnId: expectedGatewayReference,
        verifiedAt: new Date(),
        resultDesc: 'Payment verified',
      },
    },
  );
  if (result.modifiedCount) {
    await BillingEvent.create({
      restaurantId: payment.restaurantId,
      type: 'payment_success',
      by: 'system',
      data: {
        reference: payment.reference,
        invoiceId: invoice._id,
        plan: invoice.plan,
        period: invoice.period,
        amount: invoice.amount,
      },
    });
  }
}

export async function reconcilePayheroPayment(paymentId) {
  const now = new Date();
  const payment = await BillingPayment.findOneAndUpdate(
    {
      _id: paymentId,
      status: 'pending',
      $and: [
        {
          $or: [
            { gatewayTxnId: { $exists: true, $ne: '' } },
            { statusLookupReference: { $exists: true, $ne: '' } },
          ],
        },
        {
          $or: [
            { lastCheckedAt: { $exists: false } },
            { lastCheckedAt: null },
            { lastCheckedAt: { $lte: new Date(now.getTime() - STATUS_CHECK_INTERVAL_MS) } },
          ],
        },
      ],
    },
    { $set: { lastCheckedAt: now } },
    { new: true },
  );

  const lookupReference = payment?.gatewayTxnId || payment?.statusLookupReference;
  if (!lookupReference) return payment;

  const verified = await getPayheroTransactionStatus(lookupReference);
  const status = String(verified.status || '').toUpperCase();
  if (status === 'FAILED') {
    await failPayment(payment, verified.message || verified.status);
  } else if (status === 'SUCCESS' && verified.success === true) {
    await settlePayment(payment, verified);
  }

  return BillingPayment.findById(payment._id);
}

export async function handlePayheroCallback(payload) {
  const result = payload?.response;
  const reference = result?.ExternalReference;
  if (typeof reference !== 'string' || !reference) return { invalid: true };

  let payment = await BillingPayment.findOne({ reference });
  if (!payment) return { received: true };

  if (payment.status === 'flagged' && payment.flag === 'initialization_uncertain') {
    const receipt = result.MpesaReceiptNumber;
    if (typeof receipt !== 'string' || !receipt) return { received: true };
    const callbackAmount = result.Amount === undefined || result.Amount === null ? NaN : Number(result.Amount);
    payment = await BillingPayment.findOneAndUpdate(
      { _id: payment._id, status: 'flagged', flag: 'initialization_uncertain' },
      {
        $set: {
          status: 'pending',
          statusLookupReference: receipt,
          ...(Number.isSafeInteger(callbackAmount) && { callbackAmount }),
        },
      },
      { new: true },
    );
    if (!payment) return { received: true };
  }

  if (payment.status !== 'pending') return { received: true };

  if (
    payment.gatewayRequestId &&
    typeof result.CheckoutRequestID === 'string' &&
    result.CheckoutRequestID !== payment.gatewayRequestId
  ) {
    return { invalid: true };
  }

  const callbackAmount = result.Amount === undefined || result.Amount === null ? NaN : Number(result.Amount);
  const updates = {};
  if (Number.isSafeInteger(callbackAmount)) updates.callbackAmount = callbackAmount;

  if (Object.keys(updates).length) {
    await BillingPayment.updateOne(
      { _id: payment._id, status: 'pending' },
      { $set: updates },
    );
  }

  await reconcilePayheroPayment(payment._id);
  return { received: true };
}

