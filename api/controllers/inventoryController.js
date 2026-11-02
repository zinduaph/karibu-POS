import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Ingredient from '../models/ingredient.js';
import Inventory from '../models/inventory.js';

const validUnits = ['g', 'ml', 'piece'];

export const getIngredients = asyncHandler(async (req, res) => {
  const ingredients = await Ingredient.find({ restaurantId: req.user.restaurantId }).sort({ name: 1 });
  const inventory = await Inventory.find({
    restaurantId: req.user.restaurantId,
    ingredientId: { $in: ingredients.map((i) => i._id) },
  }).select('ingredientId quantity');
  const quantities = new Map(inventory.map((item) => [item.ingredientId.toString(), item.quantity]));

  return res.status(200).json({
    ingredients: ingredients.map((ingredient) => ({
      ...ingredient.toObject(),
      baseUnitQuantity: quantities.get(ingredient._id.toString()) ?? 0,
    })),
  });
});

export const addIngredient = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const inputs = Array.isArray(req.body) ? req.body : [req.body];

  if (!inputs.length || inputs.length > 100) {
    return res.status(400).json({ message: 'Provide between 1 and 100 ingredients' });
  }

  const invalid = inputs.some((item) =>
    !item || typeof item.name !== 'string' || !item.name.trim() || !validUnits.includes(item.baseUnit)
  );
  if (invalid) {
    return res.status(400).json({ message: 'Each ingredient needs a name and valid baseUnit (g, ml, or piece)' });
  }

  const ingredients = await Ingredient.insertMany(
    inputs.map((item) => ({
      restaurantId,
      name: item.name.trim(),
      baseUnit: item.baseUnit,
      lowStockThreshold: Number(item.lowStockThreshold) || 0,
      isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
    }))
  );

  await Inventory.insertMany(
    ingredients.map((ingredient, index) => ({
      restaurantId,
      ingredientId: ingredient._id,
      quantity: Number(inputs[index].baseUnitQuantity) || 0,
    }))
  );

  return res.status(201).json({
    success: true,
    message: 'Ingredients added successfully',
    ingredients: ingredients.map((ingredient, index) => ({
      ...ingredient.toObject(),
      baseUnitQuantity: Number(inputs[index].baseUnitQuantity) || 0,
    })),
  });
});

export const deleteIngredient = asyncHandler(async (req, res) => {
  const ingredient = await Ingredient.findOneAndUpdate(
    { _id: req.params.ingredientId, restaurantId: req.user.restaurantId, isActive: true },
    { $set: { isActive: false } },
    { new: true }
  );
  if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });
  return res.status(200).json({ success: true, message: 'Ingredient deleted successfully', ingredient });
});

export const getInventory = asyncHandler(async (req, res) => {
  const inventory = await Inventory.find({ restaurantId: req.user.restaurantId })
    .populate('ingredientId', 'name baseUnit lowStockThreshold isActive')
    .sort({ updatedAt: -1 });
  return res.status(200).json({ inventory });
});

export const setInventory = asyncHandler(async (req, res) => {
  const { ingredientId, quantity, averageCostPerBaseUnit } = req.body;
  if (!mongoose.isValidObjectId(ingredientId) || typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0) {
    return res.status(400).json({ message: 'Provide a valid ingredientId and non-negative quantity' });
  }

  const exists = await Ingredient.exists({ _id: ingredientId, restaurantId: req.user.restaurantId, isActive: true });
  if (!exists) return res.status(404).json({ message: 'Active ingredient not found for this restaurant' });

  const updates = { quantity };
  if (averageCostPerBaseUnit !== undefined) updates.averageCostPerBaseUnit = averageCostPerBaseUnit;

  const inventoryItem = await Inventory.findOneAndUpdate(
    { restaurantId: req.user.restaurantId, ingredientId },
    { $set: updates, $setOnInsert: { restaurantId: req.user.restaurantId, ingredientId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate('ingredientId', 'name baseUnit lowStockThreshold isActive');

  return res.status(200).json({ message: 'Inventory updated successfully', inventoryItem });
});
