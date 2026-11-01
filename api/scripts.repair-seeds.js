import 'dotenv/config';
import mongoose from 'mongoose';
import Restaurant from './models/resturant.js';
import User from './models/cashier.js';
import Sale from './models/sales.js';
import { hashPassword } from './utils/credentials.js';

if (process.env.NODE_ENV === 'production') throw new Error('Dev only');
await mongoose.connect(process.env.MONGO_URI);

const restaurants = await Restaurant.find({});
console.log('\n=== RESTAURANTS ===');
restaurants.forEach((r) => console.log(' ', r._id.toString(), '|', r.name, '|', r.code));

const users = await User.find({});
console.log('\n=== USERS ===');
users.forEach((u) => console.log(' ', u._id.toString(), '|', u.role, '|', u.name, '|', u.email || '-', '| restaurantId:', u.restaurantId?.toString()));

const seedCount = await Sale.countDocuments({ productName: /^SEED / });
console.log(`\n=== SEED SALES: ${seedCount} total ===`);

// Use existing admin, or create one under the seed restaurant
let admin = users.find((u) => u.role === 'admin');
let restaurant = restaurants[0];

if (!admin) {
  if (!restaurant) {
    restaurant = await Restaurant.create({ name: 'Seed Restaurant', code: 'SEED' });
    console.log('Created restaurant:', restaurant.name);
  }
  const passwordHash = await hashPassword('Admin123!');
  admin = await User.create({
    restaurantId: restaurant._id,
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash,
    role: 'admin',
  });
  console.log('Created admin: admin@example.com / Admin123! (restaurant:', restaurant.name, ')');
} else {
  restaurant = await Restaurant.findById(admin.restaurantId);
  console.log('Using existing admin:', admin.email);
}

const oid = restaurant._id;
const result = await Sale.updateMany(
  { productName: /^SEED / },
  { $set: { restaurantId: oid } },
);
console.log(`Repointed ${result.modifiedCount} seed sales to restaurant ${restaurant.name}`);

const after = await Sale.countDocuments({ restaurantId: oid, productName: /^SEED / });
console.log(`Seed sales for this restaurant: ${after}`);

const sample = await Sale.findOne({ restaurantId: oid, paymentStatus: 'completed' });
console.log('\nSample completed sale:', sample ? { totalAmount: sample.totalAmount, paymentMethod: sample.paymentMethod, createdAt: sample.createdAt } : 'none found');

console.log('\n=== LOG IN ===');
console.log('Email: admin@example.com');
console.log('Password: Admin123!');
console.log('Then open /dashboard/reports and pick 90 days.');
process.exit(0);
