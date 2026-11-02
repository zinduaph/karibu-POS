import { Router } from 'express';
import * as sales from '../controllers/salesController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, sales.addSale);
router.get('/', authenticate, sales.getAllSalesByHotel);
router.post('/cash-payment', authenticate, sales.cashPayment);
router.post('/till-payment', authenticate, sales.recordTillPayment);
router.post('/mpesa-prompt', authenticate, sales.startMpesaPayment);
router.get('/:saleId', authenticate, sales.getSaleById);
router.post('/mpesa/callback', sales.mpesaCallback);

export default router;
