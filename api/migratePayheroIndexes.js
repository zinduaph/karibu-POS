import './loadEnv.js';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });

try {
  const payments = mongoose.connection.db.collection('billingpayments');
  const pendingDuplicates = await payments.aggregate([
    { $match: { status: 'pending' } },
    { $group: { _id: '$restaurantId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 10 },
  ]).toArray();
  if (pendingDuplicates.length) {
    throw new Error('Resolve multiple pending payments for a restaurant before creating the payment index.');
  }

  const subscriptions = mongoose.connection.db.collection('subscriptions');
  const subscriptionDuplicates = await subscriptions.aggregate([
    { $match: { invoiceId: { $exists: true, $ne: null } } },
    { $group: { _id: '$invoiceId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 10 },
  ]).toArray();
  if (subscriptionDuplicates.length) {
    throw new Error('Resolve subscriptions sharing an invoice before creating the subscription index.');
  }

  await payments.createIndex(
    { restaurantId: 1 },
    {
      unique: true,
      partialFilterExpression: { status: 'pending' },
      name: 'one_pending_payment_per_restaurant',
    },
  );
  await subscriptions.createIndex(
    { invoiceId: 1 },
    { unique: true, sparse: true, name: 'one_subscription_per_invoice' },
  );
  console.log('PayHero billing indexes are ready.');
} finally {
  await mongoose.disconnect();
}
