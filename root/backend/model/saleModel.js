import mongoose from "mongoose";


const saleSchema = new mongoose.Schema({
    orderId:{type:mongoose.Schema.Types.ObjectId, index:true},
    hotelId: {type:mongoose.Schema.Types.ObjectId, ref:"Hotel", required:true},
    productName: {type:String, required:true},
    price:{type:Number, required:true},
    quantity:{type:Number, required:true},
    items: [{
        _id:false,
        name:{type:String, required:true},
        category:{type:String},
        price:{type:Number, required:true},
        quantity:{type:Number, required:true}
    }],
    totalAmount:{type:Number, required:true},
    paymentStatus: {type: String, enum: ['pending', 'completed', 'failed'], default: 'pending'},
    paymentMethod: {type:String, enum:['pending','cash','mpesa','mpesa_till'], default:'pending'},
    amountReceived:{type:Number},
    change:{type:Number},
    payerPhone: {type:String},
    merchantRequestId: {type:String},
    checkoutRequestId: {type:String, unique:true, sparse:true},
    mpesaReceiptNumber: {type:String},
    mpesaReceiptLast4: {type:String, uppercase:true, match:/^[A-Z0-9]{4}$/},
    createdAt: {type:Date, default: Date.now}
})

const SaleSchema = mongoose.model('sale',saleSchema)
export default SaleSchema