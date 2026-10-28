import mongoose from "mongoose";


const recipeItemSchema = new mongoose.Schema({
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    min: 0.001
  }
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
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

  category: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  recipe: {
    type: [recipeItemSchema],
    default: []
  },

  trackInventory: {
    type: Boolean,
    default: true
  },

  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const menuModel = mongoose.model('menu',menuItemSchema)

export default menuModel;