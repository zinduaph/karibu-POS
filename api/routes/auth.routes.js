import { Router } from 'express';
import * as auth from '../controllers/authcontroller.js';
import * as schema from '../validators/auth.validators.js';
import validate from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { loginLimiter, passwordRecoveryLimiter, registrationLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// Registration
router.post('/admin/register', registrationLimiter, validate(schema.adminRegister), auth.adminRegister);
router.post('/cashier/register', authenticate, requireRole('admin'), registrationLimiter, validate(schema.cashierRegister), auth.cashierRegister);

// Login
router.post('/admin/login', loginLimiter, validate(schema.adminLogin), auth.adminLogin);
router.post('/admin/forgot-password', passwordRecoveryLimiter, validate(schema.requestAdminPasswordReset), auth.requestAdminPasswordReset);
router.post('/admin/reset-password', passwordRecoveryLimiter, validate(schema.completeAdminPasswordReset), auth.completeAdminPasswordReset);
router.post('/dev/login', loginLimiter, validate(schema.devLogin), auth.devLogin);
router.post('/cashier/login', loginLimiter, validate(schema.cashierLogin), auth.cashierLogin);

// Session
router.post('/refresh', auth.refreshToken);
router.post('/logout', auth.logout);
router.get('/me', authenticate, auth.me);
router.post('/logout-all', authenticate, auth.logoutAll);

// Cashier
router.post('/unlock', authenticate, requireRole('cashier'), loginLimiter, validate(schema.unlock), auth.unlock);
router.post('/change-pin', authenticate, requireRole('cashier'), loginLimiter, validate(schema.changePin), auth.changePin);

// Admin
router.post('/change-password', authenticate, requireRole('admin'), loginLimiter, validate(schema.changePassword), auth.changePassword);
router.get('/get-cashier', authenticate, requireRole('admin'), auth.getCashier);
router.post('/delete-cashier/:cashierId', authenticate, requireRole('admin'), auth.deleteCashier);
router.post('/reset-admin-password', authenticate, requireRole('admin'), loginLimiter, validate(schema.resetAdminPassword), auth.resetAdminPassword);

export default router;