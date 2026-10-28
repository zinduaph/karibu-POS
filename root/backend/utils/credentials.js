import bcrypt from 'bcrypt';
import crypto from 'crypto';

// 6-digit PINs are easy to crack offline if only the DB leaks.
// The pepper lives in the environment, not the database, so a DB-only leak isn't enough.
const pepper = (pin) => crypto.createHmac('sha256', process.env.PIN_PEPPER).update(pin).digest('hex');

export const hashPassword = (pw) => bcrypt.hash(pw, 12);
export const hashPin = (pin) => bcrypt.hash(pepper(pin), 12);

// Dummy hash so response time doesn't reveal whether a user exists
const DUMMY_HASH = bcrypt.hashSync('dummy-value', 12);

export const checkPassword = (user, pw) => bcrypt.compare(pw, user?.passwordHash ?? DUMMY_HASH);
export const checkPin = (user, pin) => bcrypt.compare(pepper(pin), user?.pinHash ?? DUMMY_HASH);

// 000000, 111111, 123456, 654321 ...
export const isWeakPin = (pin) =>
  /^(\d)\1{5}$/.test(pin) || '0123456789'.includes(pin) || '9876543210'.includes(pin);