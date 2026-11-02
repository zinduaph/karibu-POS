import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    baseUnit: { type: String, enum: ['g', 'ml', 'piece'], required: true },
    baseUnitQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ingredientSchema.index({ restaurantId: 1, name: 1 });

export default mongoose.model('Ingredient', ingredientSchema);
