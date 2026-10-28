import express from 'express'
import { addHotelDetails, addProduct, getAllProductsByHotel, getProductById, updateProductById } from '../controller/productController.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const productRouter = express.Router()

productRouter.use(authenticate, requireRole('admin'))
productRouter.post('/add', addProduct)
productRouter.post('/all-products', getAllProductsByHotel)
productRouter.get('/product/:productId', getProductById)
productRouter.post('/update/:productId', updateProductById)
productRouter.post('/hotel-details', addHotelDetails)

export default productRouter