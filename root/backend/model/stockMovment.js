import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema({
  HotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
    index: true
  },

  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    required: true
  },

  type: {
    type: String,
    enum: ["purchase", "sale", "waste", "adjustment", "return"],
    required: true
  },

  // Positive for additions; negative for deductions
  quantityChange: {
    type: Number,
    required: true
  },

  referenceType: {
    type: String,
    enum: ["order", "purchase", "manual", "cancellation"],
    required: true
  },

  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  note: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

stockMovementSchema.index({
  restaurantId: 1,
  referenceType: 1,
  referenceId: 1
});

const StockMovmentModel = new mongoose.model('stockMovement', stockMovementSchema)
export default StockMovmentModel