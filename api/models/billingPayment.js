import mongoose from 'mongoose';

const billingPaymentSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },

    reference: { type: String, required: true, unique: true, immutable: true },
    amount: { type: Number, required: true, immutable: true },
    phone: { type: String, required: true, immutable: true },

    status: { type: String, enum: ['pending', 'success', 'failed', 'flagged'], default: 'pending' },
    flag: String,
    gatewayTxnId: String,
    gatewayRequestId: String,
    statusLookupReference: String,
    callbackAmount: Number,
    resultDesc: String,
    lastCheckedAt: Date,
    verifiedAt: Date,
  },
  { timestamps: true }
);

billingPaymentSchema.index({ restaurantId: 1, status: 1 });
billingPaymentSchema.index(
  { restaurantId: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' }, name: 'one_pending_payment_per_restaurant' }
);

for (const op of ['deleteOne', 'deleteMany', 'findOneAndDelete']) {
  billingPaymentSchema.pre(op, () => { throw new Error('Payments cannot be deleted'); });
}

export default mongoose.model('BillingPayment', billingPaymentSchema);