import { Router } from 'express'
import {
    addSale,
    cashPayment,
    getAllSalesByHotel,
    getSaleById,
    mpesaCallback,
} from '../controller/saleController.js'

const saleRouter = Router()

saleRouter.post('/', addSale)
saleRouter.get('/', getAllSalesByHotel)
saleRouter.post('/cash-payment', cashPayment)
saleRouter.get('/:saleId', getSaleById)
saleRouter.post('/mpesa/callback', mpesaCallback)

export default saleRouter
