import { Router } from 'express'
import {
    addSale,
    cashPayment,
    getAllSalesByHotel,
    getSaleById,
    mpesaCallback,
    recordTillPayment,
    startMpesaPayment,
} from '../controller/saleController.js'
import { authenticate } from '../middleware/auth.js'

const saleRouter = Router()

saleRouter.post('/', authenticate, addSale)
saleRouter.get('/', authenticate, getAllSalesByHotel)
saleRouter.post('/cash-payment', authenticate, cashPayment)
saleRouter.post('/till-payment', authenticate, recordTillPayment)
saleRouter.post('/mpesa-prompt', authenticate, startMpesaPayment)
saleRouter.get('/:saleId', authenticate, getSaleById)
saleRouter.post('/mpesa/callback', mpesaCallback)

export default saleRouter
