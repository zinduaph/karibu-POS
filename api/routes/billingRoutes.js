import { Router } from 'express';
import * as c from '../controllers/billingController.js';
import * as s from '../validators/billingValidators.js';
import { idParam } from '../validators/commonValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { payLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// Public: signature-verified, then every payment is re-verified with Paystack
router.post('/webhook', c.webhook);

// Billing belongs to the restaurant admin only, never cashiers
router.use(authenticate, requireRole('admin'));
router.get('/', c.getBilling);
router.post('/checkout', payLimiter, validate(s.checkout), c.checkout);
router.get('/invoices/:id/status', validate(idParam, 'params'), c.invoiceStatus);

export default router;