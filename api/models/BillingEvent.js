import mongoose from 'mongoose';

const billingEventSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, index: true },
    type: { type: String, required: true }, // payment_success | payment_flagged | manual_extension | migrated
    by: String,                              // 'system' | 'script' | a user id
    data: Object,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

for (const op of ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete']) {
  billingEventSchema.pre(op, () => { throw new Error('Billing events cannot be changed'); });
}

export default mongoose.model('BillingEvent', billingEventSchema);