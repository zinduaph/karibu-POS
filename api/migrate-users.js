import 'dotenv/config';
import mongoose from 'mongoose';
import { connectedDB } from './config/db.js';
import User from './models/cashier.js';

const migrate = async () => {
  await connectedDB();

  console.log('Migration not needed: single User model is in place.');
  process.exit(0);
};

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
