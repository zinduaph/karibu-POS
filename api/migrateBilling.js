import 'dotenv/config';
import mongoose from 'mongoose';
import Restaurant from './models/resturant.js';
import BillingEvent from './models/BillingEvent.js';

// Gives every existing restaurant a starting period, so turning billing on doesn't lock anyone out.
// Usage: node scripts/migrate-billing.js [days]   (default 30)
const days = Number(process.argv[2] || 30);
await mongoose.connect(process.env.MONGO_URI);

const list = await Restaurant.find({ $or: [{ accessUntil: { $exists: false } }, { accessUntil: null }] });
for (const r of list) {
  await Restaurant.updateOne({ _id: r._id }, { accessUntil: new Date(Date.now() + days * 864e5) });
  await BillingEvent.create({ restaurantId: r._id, type: 'migrated', by: 'script', data: { days } });
}
console.log(`Updated ${list.length} restaurant(s), each with ${days} days`);
process.exit(0);