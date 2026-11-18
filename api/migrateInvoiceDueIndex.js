import './loadEnv.js';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });

try {
  const invoices = mongoose.connection.db.collection('invoices');
  const indexes = await invoices.indexes();
  for (const index of indexes) {
    if (index.key?.dueAt === 1 && index.expireAfterSeconds !== undefined) {
      await invoices.dropIndex(index.name);
      console.log(`Removed expiring invoice index: ${index.name}`);
    }
  }

  const updatedIndexes = await invoices.indexes();
  if (!updatedIndexes.some((index) => index.name === 'invoice_dueAt_lookup')) {
    await invoices.createIndex({ dueAt: 1 }, { name: 'invoice_dueAt_lookup' });
  }
  console.log('Invoice due-date index is non-expiring.');
} finally {
  await mongoose.disconnect();
}
