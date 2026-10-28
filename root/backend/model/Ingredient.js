import mongoose from "mongoose";

const IngredientSchema = new mongoose.Schema({
   HotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
    index: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },
  baseUnit: {
    type: String,
    enum: ["g", "ml", "piece"],
    required: true
  },

  lowStockThreshold: {
    type: Number,
    default: 0,
    min: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }
},{timestamps:true})

const IngredientModel = mongoose.model('Ingredient',IngredientSchema)
export default IngredientModel;