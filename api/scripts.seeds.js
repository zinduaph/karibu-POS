import 'dotenv/config';
import mongoose from 'mongoose';
import Restaurant from './models/resturant.js';
import User from './models/cashier.js';
import MenuItem from './models/menuItem.js';
import Sale from './models/sales.js';

if (process.env.NODE_ENV === 'production') throw new Error('Dev only');
await mongoose.connect(process.env.MONGO_URI);

if (process.argv.includes('--clean')) {
  const r = await Sale.deleteMany({ productName: /^SEED / });
  console.log(`Removed ${r.deletedCount} fake sales`);
  process.exit(0);
}

console.log('Seeding reports data…');

let restaurant = await Restaurant.findOne();
if (!restaurant) {
  restaurant = await Restaurant.create({ name: 'Seed Restaurant', code: 'SEED', location: 'Nairobi', accessUntil: new Date(Date.now() + 14 * 864e5)})
  console.log('Created restaurant:', restaurant.name);
} else {
  console.log('Using restaurant:', restaurant.name, restaurant._id);
}

let cashiers = await User.find({ restaurantId: restaurant._id, role: 'cashier' });
if (cashiers.length === 0) {
  cashiers = await User.insertMany([
    { restaurantId: restaurant._id, role: 'cashier', name: 'Alice Cashier', username: 'alice', pinHash: 'x', isActive: true },
    { restaurantId: restaurant._id, role: 'cashier', name: 'Bob Cashier', username: 'bob', pinHash: 'x', isActive: true },
  ]);
  console.log('Created', cashiers.length, 'cashiers');
} else {
  console.log('Using', cashiers.length, 'cashiers');
}

let menu = await MenuItem.find({ restaurantId: restaurant._id });
if (menu.length === 0) {
  menu = await MenuItem.insertMany([
    { restaurantId: restaurant._id, name: 'Ugali & Sukuma', category: 'Main', price: 250, isAvailable: true },
    { restaurantId: restaurant._id, name: 'Pilau', category: 'Main', price: 350, isAvailable: true },
    { restaurantId: restaurant._id, name: 'Nyama Choma', category: 'Main', price: 600, isAvailable: true },
    { restaurantId: restaurant._id, name: 'Soda', category: 'Drink', price: 100, isAvailable: true },
    { restaurantId: restaurant._id, name: 'Tea', category: 'Drink', price: 80, isAvailable: true },
  ]);
  console.log('Created', menu.length, 'menu items');
} else {
  console.log('Using', menu.length, 'menu items');
}

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const HOURS = [9, 10, 12, 13, 13, 14, 18, 19, 19, 20, 21];

const sales = Array.from({ length: 600 }, (_, i) => {
  const when = new Date(Date.now() - Math.random() * 60 * 864e5);
  when.setUTCHours(pick(HOURS) - 3, Math.floor(Math.random() * 60));
  const items = Array.from({ length: 1 + Math.floor(Math.random() * 4) }, () => {
    const m = pick(menu);
    return { name: m.name, category: m.category, price: m.price, quantity: 1 + Math.floor(Math.random() * 3) };
  });
  const totalAmount = items.reduce((s, l) => s + l.price * l.quantity, 0);
  const roll = Math.random();
  const paymentStatus = roll < 0.88 ? 'completed' : roll < 0.94 ? 'pending' : 'failed';
  const paymentMethod = Math.random() < 0.55 ? 'mpesa' : 'cash';
  return {
    restaurantId: restaurant._id,
    orderId: new mongoose.Types.ObjectId(),
    productName: `SEED ${i}`,
    items,
    totalAmount,
    paymentStatus,
    paymentMethod,
    createdAt: when,
  };
});

await Sale.insertMany(sales);
console.log(`Inserted ${sales.length} fake sales`);
console.log('Done. Open /dashboard/reports and pick a date range covering the last ~60 days.');
process.exit(0);
