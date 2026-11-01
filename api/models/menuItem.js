import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    trackInventory: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    recipe: [{ ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' }, quantity: Number }],
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurantId: 1, name: 1 });

export default mongoose.model('MenuItem', menuItemSchema);
