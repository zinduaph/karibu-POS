import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    plan: { type: String, required: true },
    period: { type: String, enum: ['monthly', 'yearly'], required: true },
    amount: { type: Number, required: true }, // cents
    status: { type: String, enum: ['open', 'paid', 'voided', 'refunded'], default: 'open' },
    reference: { type: String, required: true, unique: true, index: true },
    dueAt: { type: Date, required: true },
    paidAt: Date,
    gatewayTxnId: String,
    metadata: Object,
  },
  { timestamps: true }
);

invoiceSchema.index({ restaurantId: 1, status: 1 });
invoiceSchema.index({ dueAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Invoice', invoiceSchema);
