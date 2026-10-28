import express from 'express';
import * as auth from '../controller/authcontroller.js';
import * as schema from '../validators/auth.validators.js';
import validate from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { loginLimiter, registrationLimiter } from '../middleware/rateLimiter.js';

const userRoutes = express.Router();

// Login
userRoutes.post('/admin/register', registrationLimiter, validate(schema.adminRegister), auth.adminRegister);
userRoutes.post('/admin/login',   loginLimiter, validate(schema.adminLogin),   auth.adminLogin);
userRoutes.post('/cashier/login', loginLimiter, validate(schema.cashierLogin), auth.cashierLogin);
userRoutes.post(
  '/cashier/register',
  authenticate,
  requireRole('admin'),
  registrationLimiter,
  validate(schema.cashierRegister),
  auth.cashierRegister
);

// Session
userRoutes.post('/refresh',     auth.refreshToken);
userRoutes.post('/logout',      auth.logout);
userRoutes.get('/me',           authenticate, auth.me);
userRoutes.post('/logout-all',  authenticate, auth.logoutAll);

// Cashier
userRoutes.post('/unlock',      authenticate, requireRole('cashier'), loginLimiter, validate(schema.unlock),    auth.unlock);
userRoutes.post('/change-pin',  authenticate, requireRole('cashier'), loginLimiter, validate(schema.changePin), auth.changePin);
userRoutes.get('/get-cashier', authenticate, requireRole('admin'), auth.getCashier);

// Admin
userRoutes.post('/change-password', authenticate, requireRole('admin'), loginLimiter, validate(schema.changePassword), auth.changePassword);

export default userRoutes;