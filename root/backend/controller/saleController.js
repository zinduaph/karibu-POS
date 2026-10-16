import mongoose from 'mongoose'
import SaleSchema from '../model/saleModel.js'
import {
    assertMpesaConfigured,
    normalizeKenyanPhone,
    initiateStkPush
} from '../services/mpesaService.js'

export const addSale = async (req,res) => {
    try{
        const userId = req.userId?.userId
        if(!userId || !mongoose.Types.ObjectId.isValid(userId)){
            return res.status(401).json({success:false, message:'Authentication required'})
        }

        const {orderId, productName, price, quantity, items, paymentMethod = 'cash', phoneNumber} = req.body
        if(!['cash', 'mpesa'].includes(paymentMethod) ||
           (items !== undefined && !Array.isArray(items)) ||
           (orderId !== undefined && !mongoose.Types.ObjectId.isValid(orderId))){
            return res.status(400).json({success:false, message:'Please provide a product name, valid price and quantity, and payment method'})
        }

        const saleItems = items === undefined
            ? [{
                name:productName,
                price:Number(price),
                quantity:Number(quantity)
            }]
            : items.map(item => ({
                name:typeof item?.name === 'string' ? item.name.trim() : '',
                category:typeof item?.category === 'string' ? item.category : undefined,
                price:Number(item?.price),
                quantity:Number(item?.quantity)
            }))

        if(saleItems.length === 0 || saleItems.some(item =>
            !item.name ||
            !Number.isFinite(item.price) || item.price <= 0 ||
            !Number.isInteger(item.quantity) || item.quantity <= 0
        )){
            return res.status(400).json({success:false, message:'Please provide valid sale items, prices, and quantities'})
        }

        const totalAmount = Math.round(saleItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        ))
        if(!Number.isSafeInteger(totalAmount) || totalAmount < 1){
            return res.status(400).json({success:false, message:'Sale total must be at least KES 1'})
        }

        const numericPrice = items === undefined ? Number(price) : totalAmount
        const numericQuantity = items === undefined ? Number(quantity) : 1
        const saleName = items === undefined
            ? productName.trim()
            : saleItems.map(item => `${item.name} x ${item.quantity}`).join(', ')

        let payerPhone
        if(paymentMethod === 'mpesa'){
            try{
                payerPhone = normalizeKenyanPhone(phoneNumber)
            }catch(error){
                return res.status(400).json({success:false, message:error.message})
            }

            try{
                assertMpesaConfigured()
            }catch(error){
                console.error('M-Pesa configuration error:', error.message)
                return res.status(503).json({success:false, message:'M-Pesa payments are not configured'})
            }
        }

        const saleId = new mongoose.Types.ObjectId()
        const newSale = new SaleSchema({
            _id:saleId,
            orderId:orderId || saleId,
            hotelId: userId,
            productName:saleName,
            price:numericPrice,
            quantity:numericQuantity,
            items:saleItems,
            totalAmount,
            paymentStatus:'pending',
            paymentMethod,
            payerPhone
        })
        await newSale.save()

        if(paymentMethod === 'mpesa'){
            try{
                const payment = await initiateStkPush({
                    phoneNumber:payerPhone,
                    amount:totalAmount,
                    accountReference:newSale._id.toString()
                })

                newSale.merchantRequestId = payment.MerchantRequestID
                newSale.checkoutRequestId = payment.CheckoutRequestID
                await newSale.save()

                return res.status(202).json({
                    success:true,
                    message:'Sale created. Approve the M-Pesa prompt on your phone.',
                    sale:newSale
                })
            }catch(error){
                if(error.paymentOutcome === 'rejected'){
                    newSale.paymentStatus = 'failed'
                    await newSale.save()
                }
                console.error('Error initiating M-Pesa payment:', error.message)
                return res.status(502).json({
                    success:false,
                    message:error.paymentOutcome === 'unknown'
                        ? 'M-Pesa did not confirm whether the prompt was created. Check the sale status before retrying.'
                        : 'Could not start the M-Pesa payment. Please try again.',
                    sale:newSale
                })
            }
        }

        return res.status(201).json({success:true, message:'Sale added successfully', sale:newSale})

    }catch(error){
        console.error('Error adding sale:', error)
        return res.status(500).json({success:false, message:'Internal server error'})
    }
}

export const mpesaCallback = async (req,res) => {
    const callback = req.body?.Body?.stkCallback
    const checkoutRequestId = callback?.CheckoutRequestID
    const resultCode = Number(callback?.ResultCode)

    if(typeof checkoutRequestId !== 'string' || !Number.isInteger(resultCode)){
        return res.status(400).json({success:false, message:'Invalid M-Pesa callback'})
    }

    if(resultCode !== 0){
        const failedSale = await SaleSchema.findOneAndUpdate(
            {checkoutRequestId, paymentStatus:'pending'},
            {$set:{paymentStatus:'failed'}}
        )
        if(!failedSale){
            console.warn('Ignoring M-Pesa callback for unknown or already processed checkout:', checkoutRequestId)
        }
        return res.status(200).json({ResultCode:0, ResultDesc:'Callback received'})
    }

    const sale = await SaleSchema.findOne({checkoutRequestId, paymentStatus:'pending'})
    if(!sale){
        console.warn('Ignoring M-Pesa callback for unknown or already processed checkout:', checkoutRequestId)
        return res.status(200).json({ResultCode:0, ResultDesc:'Callback received'})
    }

    const metadataItems = callback.CallbackMetadata?.Item
    const metadata = Array.isArray(metadataItems)
        ? Object.fromEntries(metadataItems.filter(item => item?.Name).map(item => [item.Name, item.Value]))
        : {}

    let callbackPhone
    try{
        callbackPhone = normalizeKenyanPhone(String(metadata.PhoneNumber ?? ''))
    }catch{
        callbackPhone = null
    }

    if(Number(metadata.Amount) !== sale.totalAmount ||
       !metadata.MpesaReceiptNumber ||
       callbackPhone !== sale.payerPhone){
        console.error('M-Pesa callback details did not match the pending sale:', sale._id.toString())
        return res.status(200).json({ResultCode:0, ResultDesc:'Callback received'})
    }

    const completedSale = await SaleSchema.findOneAndUpdate(
        {checkoutRequestId, paymentStatus:'pending'},
        {
            $set:{
                paymentStatus:'completed',
                mpesaReceiptNumber:String(metadata.MpesaReceiptNumber)
            }
        },
        {new:true}
    )
    if(!completedSale){
        console.warn('Ignoring duplicate M-Pesa callback for checkout:', checkoutRequestId)
    }

    return res.status(200).json({ResultCode:0, ResultDesc:'Callback received'})
}

// This API retrieves all the orders for a sepecific hotel
// save the oders as pedning as the customer is eating in the hotel and then can initiate the payment when the customer is done with the meal

export const getAllSalesByHotel = async (req,res) => {
    const userId = req.userId?.userId
    const {page = 1, limit = 10} = req.query
    const numericPage = Number(page)
    try{
        if(!userId || !mongoose.Types.ObjectId.isValid(userId)){
            return res.status(401).json({success:false, message:'Authentication required'})
        }

        const numericLimit = Number(limit)
        if(!Number.isInteger(numericPage) || numericPage < 1 ||
           !Number.isInteger(numericLimit) || numericLimit < 1 || numericLimit > 100){
            return res.status(400).json({success:false, message:'Invalid page or limit'})
        }

        const [sales, totalSales] = await Promise.all([
            SaleSchema.find({hotelId:userId})
                .sort({createdAt:-1})
                .skip((numericPage - 1) * numericLimit)
                .limit(numericLimit),
            SaleSchema.countDocuments({hotelId:userId})
        ])

        return res.json({
            success:true,
            sales,
            totalSales,
            currentPage:numericPage,
            totalPages:Math.ceil(totalSales / numericLimit)
        })
        

    } catch(error) {
        console.error('Error retrieving sales:', error.message)
        return res.status(500).json({success:false, message:'Internal server error'})
    }
}

// This API is the cash payment API for when the cashier receives the cash 
// from the customer they enter the amount of cash recived and the order id and the API will update the payment status to completed

export const cashPayment = async (req,res) => {
    const userId = req.userId?.userId
    const {orderId, amountReceived} = req.body
    try{
        if(!userId || !mongoose.Types.ObjectId.isValid(userId)){
            return res.status(401).json({success:false, message:'Authentication required'})
        }

        if(!mongoose.Types.ObjectId.isValid(orderId)){
            return res.status(400).json({success:false, message:'Invalid order ID'})
        }

        const numericAmountReceived = Number(amountReceived)
        if(!Number.isFinite(numericAmountReceived) || numericAmountReceived <= 0){
            return res.status(400).json({success:false, message:'Invalid amount received'})
        }
        const sale = await SaleSchema.findOne({orderId, hotelId:userId})
        if(!sale){
            return res.status(404).json({success:false, message:'Sale not found'})
        }

        if(sale.paymentMethod !== 'cash'){
            return res.status(400).json({success:false, message:'This sale is not a cash payment'})
        }

        if(sale.paymentStatus !== 'pending'){
            return res.status(400).json({success:false, message:'This sale is not pending payment'})
        }

        if(numericAmountReceived < sale.totalAmount){
            return res.status(400).json({success:false, message:'Amount received is less than the sale total'})
        }

        sale.paymentStatus = 'completed'
        sale.amountReceived = numericAmountReceived
        sale.change = numericAmountReceived - sale.totalAmount
        await sale.save()
        return res.json({success:true, message:"cash payment completed successfully", sale})

    } catch(error){
        console.error('Error processing cash payment:', error.message)
        return res.status(500).json({success:false, message:'Internal server error'})
    }
}

// This API is to get a specific sale by id for admin to view the sale details and the payment status
export const getSaleById = async (req,res) => {
    const userId = req.userId?.userId
    const {saleId} = req.params
    try{
        if(!userId || !mongoose.Types.ObjectId.isValid(userId)){
            return res.status(401).json({success:false, message:'Authentication required'})
        }
        if(!mongoose.Types.ObjectId.isValid(saleId)){
            return res.status(400).json({success:false, message:'Invalid sale ID'})
        }

        const sale = await SaleSchema.findOne({_id:saleId, hotelId:userId})
        if(!sale){
            return res.status(404).json({success:false, message:'Sale not found'})
        }

        return res.json({success:true, sale})

    } catch(error){
        console.error('Error retrieving sale:', error.message)
        return res.status(500).json({success:false, message:'Internal server error'})
    }
}