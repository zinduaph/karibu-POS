import mongoose from 'mongoose';

const salesSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    productName: { type: String, trim: true },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    items: [{ name: String, category: String, price: Number, quantity: Number }],
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending', index: true },
    paymentMethod: { type: String, enum: ['cash', 'mpesa', 'mpesa_till', 'pending'], default: 'pending' },
    payerPhone: { type: String, trim: true },
    checkoutRequestId: { type: String, trim: true, index: true },
    merchantRequestId: { type: String, trim: true },
    mpesaReceiptNumber: { type: String, trim: true },
    mpesaReceiptLast4: { type: String, trim: true },
    amountReceived: { type: Number, min: 0 },
    change: { type: Number, min: 0 },
  },
  { timestamps: true }
);

salesSchema.index({ restaurantId: 1, createdAt: -1 });
salesSchema.index({ orderId: 1, restaurantId: 1 }, { unique: true });

export default mongoose.model('Sale', salesSchema);
