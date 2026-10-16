import express from 'express'
import { addHotelDetails, addProduct, getAllProductsByHotel, getProductById, updateProductById } from '../controller/productController.js'

const productRouter = express.Router()

productRouter.post('/add', addProduct )
productRouter.post('/all-products', getAllProductsByHotel)
productRouter.post('/prouct/:prouctId',getProductById)
productRouter.post('/update/:productId',updateProductById)
productRouter.post('/hotel-details', addHotelDetails)

export default productRouter