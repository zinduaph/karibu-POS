import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    location: { type: String, trim: true },
    contactInfo: { type: String, trim: true },
    hotelEmail: { type: String, trim: true, lowercase: true },
    logo: { type: String, trim: true },
    onboardingComplete: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
     
     accessUntil: Date,            // the ONE field that decides access; only verified payments and admin scripts change it
planCode: String,             // empty while on the free trial
billingPeriod: { type: String, enum: ['monthly', 'yearly'] },
lastNotice: String,           // which reminder was already sent, so none repeat

// after the schema definition:

  },
  { timestamps: true }
);
restaurantSchema.index({ accessUntil: 1 });
export default mongoose.model('Restaurant', restaurantSchema); 