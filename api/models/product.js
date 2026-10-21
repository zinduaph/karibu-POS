import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    category: { type: String, enum: ['food', 'drink'], default: 'food' },
    stockQuantity: { type: Number, required: true, min: 0 },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ restaurantId: 1, name: 1 });

export default mongoose.model('Product', productSchema);
