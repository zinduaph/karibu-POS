import 'dotenv/config';
import mongoose from 'mongoose';
import Restaurant from '../src/models/Restaurant.js';
import BillingEvent from '../src/models/BillingEvent.js';
import { addMonths } from '../src/utils/dates.js';

// Usage: node scripts/extend-access.js MYRESTO 1 "paid KES 3000 cash, ref ABC123"
const [code, monthsArg, ...note] = process.argv.slice(2);
const months = Number(monthsArg);
if (!code || !Number.isInteger(months) || months < 1 || months > 24) {
  console.error('Usage: node scripts/extend-access.js CODE MONTHS "note"');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const r = await Restaurant.findOne({ code: code.toUpperCase() });
if (!r) { console.error('No such restaurant'); process.exit(1); }

const base = r.accessUntil && r.accessUntil > new Date() ? r.accessUntil : new Date();
const until = addMonths(base, months);
await Restaurant.updateOne({ _id: r._id }, { $max: { accessUntil: until }, $set: { lastNotice: null } });
await BillingEvent.create({
  restaurantId: r._id, type: 'manual_extension', by: 'script', data: { months, until, note: note.join(' ') },
});
console.log(`${r.code} now has access until ${until.toISOString()}`);
process.exit(0);