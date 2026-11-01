import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    plan: { type: String, required: true },
    period: { type: String, enum: ['monthly', 'yearly'], required: true },
    status: { type: String, enum: ['active', 'past_due', 'canceled', 'expired'], default: 'active' },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    canceledAt: Date,
    canceledReason: String,
    metadata: Object,
  },
  { timestamps: true }
);

subscriptionSchema.index({ restaurantId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Subscription', subscriptionSchema);
