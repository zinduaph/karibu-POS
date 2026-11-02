import mongoose from 'mongoose'
import HotelModel from '../model/HotelModel.js'
import ProductModel from '../model/productModel.js'
import User from '../model/userModel.js'

// API to add new product for a specific hotel
export const addProduct = async (req,res) => {
    const {userId} = req.userId
    const {name,price,category,} = req.body 
    try {
        const user = await User.findById(userId)
        if(!user) {
            return res.json({success:false, message:"user not found please login again"})
        }
        if(!name || !price || !category){
            return res.json({success:false, message:'please fill in the input fileds'} )
        }

        const newProduct = new ProductModel({
            name,
            price,
            category,
            hotelId:userId
        })
        await newProduct.save()
        res.json({success:true, message:'product added successfully'})
    } catch (error) {
        res.json({success:false, message:'error adding product'})
    }
}

// API to get all product for a specific hotel
export const getAllProductsByHotel = async (req, res) => {
    const {userId } = req.userId
    try {
        const user = await User.findById(userId)
        if(!user) {
            return res.json({success:false, message:"user not found please login again"})
        }
        const products = await ProductModel.find({hotelId:userId})
        res.json({success:true, products})
    } catch (error) {
        res.json({success:false, message:'error getting products'})
    }
}

// API to get a specific product by id
export const getProductById = async (req,res) => {
    const {productId} = req.params
    const {userId} = req.userId
    try {
        const user = await User.findById(userId)
        if(!user){
            return res.json({success:false, message:"user not found please login again"})
        }
        const product = await ProductModel.findById(productId).where('hotelId').equals(userId)
        if(!product){
            return res.json({success:false, message:"product not found"})
        }
        res.json({success:true, product})
    } catch (error) {
        res.json({success:false, message:'error getting product'})
    }
}

// update product by id
export const updateProductById = async (req,res) => {
    const {productId} = req.params
    const {userId} = req.userId
    try {
        const user = await User.findById(userId)
        if(!user){
            return res.json({success:false, message:"user not found please login again"})
        }
        const product = await ProductModel.findById(productId).where('hotelId').equals(userId)
        if(!product){
            return res.json({success:false, message:"product not found"})
        }
        // Update the product
        const {name,price,category} = req.body
        product.name = name || product.name
        product.price = price || product.price
        product.category = category || product.category
        await product.save()
        res.json({success:true, message:'product updated successfully'})
    } catch (error) {
        res.json({success:false, message:'error updating product'})
    }
}

// Save the restaurant's settings, creating them the first time and updating them thereafter.
export const addHotelDetails = async (req,res) => {
    const hotelId = req.user?.restaurantId
    const {name, location, customerCareNumber, hotelEmail = ''} = req.body ?? {}
    if (!hotelId || !mongoose.isValidObjectId(hotelId)) {
        return res.status(401).json({success:false, message:'Authentication required'})
    }
    if (
        typeof name !== 'string' || !name.trim() ||
        typeof location !== 'string' || !location.trim() ||
        typeof customerCareNumber !== 'string' || !customerCareNumber.trim() ||
        typeof hotelEmail !== 'string'
    ) {
        return res.status(400).json({success:false, message:'Provide a name, location, and customer care number'})
    }

    try {
        const hotelDetails = await HotelModel.findOneAndUpdate(
            {hotelId},
            {
                name: name.trim(),
                location: location.trim(),
                customerCareNumber: customerCareNumber.trim(),
                hotelEmail: hotelEmail.trim(),
            },
            {new:true, upsert:true, runValidators:true, setDefaultsOnInsert:true}
        )
        return res.json({success:true, message:'Hotel details saved successfully', hotelDetails})
    } catch (error) {
        console.error('Failed to save hotel details:', error)
        return res.status(500).json({success:false, message:'Unable to save hotel details'})
    }
}

export const getHotelDetails = async (req,res) => {
    const hotelId = req.user?.restaurantId
    if (!hotelId || !mongoose.isValidObjectId(hotelId)) {
        return res.status(401).json({success:false, message:'Authentication required'})
    }
    try {
        const hotelDetails = await HotelModel.findOne({hotelId}).select(
            'name location customerCareNumber hotelEmail'
        )
        return res.json({success:true, hotelDetails})
    } catch (error) {
        console.error('Failed to get hotel details:', error)
        return res.status(500).json({success:false, message:'Unable to get hotel details'})
    }
}