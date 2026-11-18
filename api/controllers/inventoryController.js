import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Ingredient from '../models/ingredient.js';
import Inventory from '../models/inventory.js';
import MenuItem from '../models/menuItem.js';

const validUnits = ['g', 'ml', 'piece', 'kg', 'L'];
const unitGroups = { g: 'weight', kg: 'weight', ml: 'volume', L: 'volume', piece: 'count' };
const unitFactors = { g: 1, kg: 1000, ml: 1, L: 1000, piece: 1 };

function getUnitConversionFactor(fromUnit, toUnit) {
  if (unitGroups[fromUnit] !== unitGroups[toUnit]) return null;
  return unitFactors[fromUnit] / unitFactors[toUnit];
}

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

export const updateIngredient = asyncHandler(async (req, res) => {
  const { ingredientId } = req.params;
  if (!mongoose.isValidObjectId(ingredientId)) {
    return res.status(400).json({ message: 'Provide a valid ingredientId' });
  }

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ message: 'Provide ingredient fields to update' });
  }

  const updates = {};
  if (Object.hasOwn(req.body, 'name')) {
    if (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.trim().length > 100) {
      return res.status(400).json({ message: 'Ingredient name must be between 1 and 100 characters' });
    }
    updates.name = req.body.name.trim();
  }
  if (Object.hasOwn(req.body, 'lowStockThreshold')) {
    if (typeof req.body.lowStockThreshold !== 'number' || !Number.isFinite(req.body.lowStockThreshold) || req.body.lowStockThreshold < 0) {
      return res.status(400).json({ message: 'lowStockThreshold must be a non-negative number' });
    }
    updates.lowStockThreshold = req.body.lowStockThreshold;
  }
  if (Object.hasOwn(req.body, 'baseUnit')) {
    if (!validUnits.includes(req.body.baseUnit)) {
      return res.status(400).json({ message: 'Provide a valid baseUnit (g, ml, piece, kg, or L)' });
    }
    updates.baseUnit = req.body.baseUnit;
  }
  if (Object.hasOwn(req.body, 'baseUnitQuantity')) {
    if (typeof req.body.baseUnitQuantity !== 'number' || !Number.isFinite(req.body.baseUnitQuantity) || req.body.baseUnitQuantity < 0) {
      return res.status(400).json({ message: 'baseUnitQuantity must be a non-negative number' });
    }
    updates.baseUnitQuantity = req.body.baseUnitQuantity;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Provide ingredient fields to update' });
  }

  const restaurantId = req.user.restaurantId;
  const session = await mongoose.startSession();
  let ingredient;
  let baseUnitQuantity = 0;
  let validationError = '';

  try {
    await session.withTransaction(async () => {
      const currentIngredient = await Ingredient.findOne({ _id: ingredientId, restaurantId }).session(session);
      if (!currentIngredient) return;

      const nextUnit = updates.baseUnit ?? currentIngredient.baseUnit;
      const unitChanged = nextUnit !== currentIngredient.baseUnit;
      const conversionFactor = getUnitConversionFactor(currentIngredient.baseUnit, nextUnit);
      if (conversionFactor === null) {
        validationError = 'Base unit can only be changed between g and kg, or between ml and L';
        return;
      }

      const inventory = await Inventory.findOne({ restaurantId, ingredientId }).session(session);
      const currentQuantity = inventory?.quantity ?? 0;
      baseUnitQuantity = Object.hasOwn(updates, 'baseUnitQuantity')
        ? updates.baseUnitQuantity
        : currentQuantity * conversionFactor;

      const ingredientUpdates = { ...updates };
      delete ingredientUpdates.baseUnitQuantity;
      if (unitChanged && !Object.hasOwn(updates, 'lowStockThreshold')) {
        ingredientUpdates.lowStockThreshold = currentIngredient.lowStockThreshold * conversionFactor;
      }

      ingredient = await Ingredient.findOneAndUpdate(
        { _id: ingredientId, restaurantId },
        { $set: ingredientUpdates },
        { new: true, runValidators: true, session }
      );

      if (Object.hasOwn(updates, 'baseUnitQuantity') || unitChanged) {
        const inventoryUpdates = { quantity: baseUnitQuantity };
        if (unitChanged && inventory?.averageCostPerBaseUnit != null) {
          inventoryUpdates.averageCostPerBaseUnit = inventory.averageCostPerBaseUnit / conversionFactor;
        }
        await Inventory.findOneAndUpdate(
          { restaurantId, ingredientId },
          {
            $set: inventoryUpdates,
            $setOnInsert: { restaurantId, ingredientId },
          },
          { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true, session }
        );
      }

      if (unitChanged) {
        await MenuItem.updateMany(
          { restaurantId, 'recipe.ingredientId': ingredientId },
          { $mul: { 'recipe.$[recipe].quantity': conversionFactor } },
          { arrayFilters: [{ 'recipe.ingredientId': ingredientId }], session }
        );
      }
    });
  } finally {
    await session.endSession();
  }

  if (!ingredient && !validationError) return res.status(404).json({ message: 'Ingredient not found' });
  if (validationError) return res.status(400).json({ message: validationError });

  return res.status(200).json({
    success: true,
    message: 'Ingredient updated successfully',
    ingredient: { ...ingredient.toObject(), baseUnitQuantity },
  });
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
