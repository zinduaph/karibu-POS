import { Router } from 'express';
import * as c from '../controllers/billingController.js';
import * as s from '../validators/billingValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { payLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// Public callback; payment status is verified against PayHero before access is granted.
router.post('/webhook', c.webhook);

// Billing belongs to the restaurant admin only, never cashiers
router.use(authenticate, requireRole('admin'));
router.get('/', c.getBilling);
router.post('/checkout', payLimiter, validate(s.checkout), c.checkout);
router.get('/invoices/:id/status', validate(s.invoiceStatusParams, 'params'), c.invoiceStatus);

export default router;