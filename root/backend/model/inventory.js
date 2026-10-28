import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  HotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true
  },

  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },

  averageCostPerBaseUnit: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

inventorySchema.index(
  { HotelId: 1, ingredientId: 1 },
  { unique: true }
);

const InventoryModel = mongoose.model('Inventory', inventorySchema);

export default InventoryModel;