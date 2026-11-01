import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true, index: true },
    quantity: { type: Number, default: 0, min: 0 },
    averageCostPerBaseUnit: { type: Number, min: 0 },
  },
  { timestamps: true }
);

inventorySchema.index({ restaurantId: 1, ingredientId: 1 }, { unique: true });

export default mongoose.model('Inventory', inventorySchema);
