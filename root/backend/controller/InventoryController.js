import mongoose from 'mongoose';
import IngredientModel from '../model/Ingredient.js';
import InventoryModel from '../model/inventory.js';
import MenuItemModel from '../model/MenuItem.js';

export const addMenuItems = async (req, res) => {
  const HotelId = req.user?.HotelId;
  if (!HotelId || !mongoose.isValidObjectId(HotelId)) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { name, category, price, recipe, trackInventory, isAvailable } = req.body ?? {};
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof category !== 'string' ||
    !category.trim() ||
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price < 0 ||
    (recipe !== undefined && !Array.isArray(recipe)) ||
    (trackInventory !== undefined && typeof trackInventory !== 'boolean') ||
    (isAvailable !== undefined && typeof isAvailable !== 'boolean')
  ) {
    return res.status(400).json({
      success: false,
      message: 'Provide a name, category, non-negative price, and valid optional fields',
    });
  }

  const menuRecipe = recipe ?? [];
  if ((trackInventory ?? true) && menuRecipe.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Add at least one ingredient to the recipe when inventory tracking is enabled',
    });
  }
  const ingredientIds = [];
  const seenIngredientIds = new Set();

  for (const item of menuRecipe) {
    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item) ||
      !mongoose.isValidObjectId(item.ingredientId) ||
      typeof item.quantity !== 'number' ||
      !Number.isFinite(item.quantity) ||
      item.quantity < 0.001
    ) {
      return res.status(400).json({
        success: false,
        message: 'Each recipe item needs a valid ingredientId and quantity of at least 0.001',
      });
    }

    const ingredientId = String(item.ingredientId);
    if (seenIngredientIds.has(ingredientId)) {
      return res.status(400).json({
        success: false,
        message: 'An ingredient can only appear once in a recipe',
      });
    }
    seenIngredientIds.add(ingredientId);
    ingredientIds.push(ingredientId);
  }

  try {
    if (ingredientIds.length) {
      const ingredientCount = await IngredientModel.countDocuments({
        _id: { $in: ingredientIds },
        HotelId,
        isActive: true,
      });
      if (ingredientCount !== ingredientIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Recipe ingredients must be active and belong to your restaurant',
        });
      }
    }

    const menuItem = await MenuItemModel.create({
      HotelId,
      name: name.trim(),
      category: category.trim(),
      price,
      ...(recipe !== undefined && {
        recipe: menuRecipe.map(({ ingredientId, quantity }) => ({
          ingredientId,
          quantity,
        })),
      }),
      ...(trackInventory !== undefined && { trackInventory }),
      ...(isAvailable !== undefined && { isAvailable }),
    });

    return res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      menuItem,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: 'Invalid menu item data' });
    }

    console.error('Failed to add menu item:', error);
    return res.status(500).json({ success: false, message: 'Unable to add menu item' });
  }
};

export const getMenuItems = async (req,res) => {
  const HotelId = req.user?.HotelId;
  if (!HotelId || !mongoose.isValidObjectId(HotelId)) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const menuItems = await MenuItemModel.find({ HotelId })
      .populate('recipe.ingredientId', 'name baseUnit')
      .sort({ name: 1 });
    return res.status(200).json({ success: true, menuItems });
  } catch (error) {
    console.error('Failed to get menu items:', error);
    return res.status(500).json({ success: false, message: 'Unable to get menu items' });
  }
}

export const deleteMenuItems = async (req,res) => {
  const HotelId = req.user?.HotelId
  const menuItemId = req.params?.menuItemId

  try {
      if(!HotelId || !mongoose.isValidObjectId(HotelId)){
        return res.status(401).json({success:false, message:'Authentication required'})
      }
      if(!menuItemId || !mongoose.isValidObjectId(menuItemId)){
        return res.status(400).json({success:false, message:'Invalid menu item ID'})
      }

      const menuItem = await MenuItemModel.findOneAndDelete({HotelId, _id:menuItemId})
      if(!menuItem){
        return res.status(404).json({success:false, message:'Menu item not found'})
      }
      return res.status(200).json({success:true, message:'Menu item deleted successfully'})
  } catch (error) {
    console.error('Failed to delete menu item:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete menu item' });
  }
}


export const AddIngredient = async (req,res) => {
    const HotelId = req.user?.HotelId 
    try {
        if(!HotelId || !mongoose.isValidObjectId(HotelId)){
             return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const inputs = Array.isArray(req.body) ? req.body : [req.body]

        if(inputs.length === 0 || inputs.length > 100){
              return res.status(400).json({
      success: false,
      message: 'Each ingredient needs a name and valid baseUnit (g, ml, or piece)',
    });
        }
       
        const validUnits = ['g','ml', 'piece']
          const invalidIngredient = inputs.some((item) =>
    !item ||
    typeof item !== 'object' ||
    Array.isArray(item) ||
    typeof item.name !== 'string' ||
    !item.name.trim() ||
    !validUnits.includes(item.baseUnit) ||
    (item.baseUnitQuantity !== undefined &&
      (typeof item.baseUnitQuantity !== 'number' ||
        !Number.isFinite(item.baseUnitQuantity) ||
        item.baseUnitQuantity < 0)) ||
    (item.lowStockThreshold !== undefined &&
      (typeof item.lowStockThreshold !== 'number' ||
        !Number.isFinite(item.lowStockThreshold) ||
        item.lowStockThreshold < 0)) ||
    (item.isActive !== undefined && typeof item.isActive !== 'boolean')
  ); 
        if(invalidIngredient){
          return res.status(400).json({
      success: false,
      message: 'Each ingredient needs a name and valid baseUnit (g, ml, or piece)',
    });
        }

      const ingredients = await IngredientModel.insertMany(
        inputs.map((item) => ({
           HotelId,
        name: item.name.trim(),
        baseUnit: item.baseUnit,
        lowStockThreshold: item.lowStockThreshold ?? 0,
        isActive: item.isActive ?? true,
        }))
       )
       await InventoryModel.insertMany(
        ingredients.map((ingredient, index) => ({
          HotelId,
          ingredientId: ingredient._id,
          quantity: inputs[index].baseUnitQuantity ?? 0,
        }))
       )
       return res.status(201).json({
         success: true,
         message: 'Ingredients added successfully',
         ingredients: ingredients.map((ingredient, index) => ({
           ...ingredient.toObject(),
           baseUnitQuantity: inputs[index].baseUnitQuantity ?? 0,
         })),
       })
    } catch (error) {
       console.error('Failed to add ingredients:', error);
       return res.status(500).json({ success: false, message: 'Unable to add ingredients' });
    }
}

export const getIngredients = async (req, res) => {
  const HotelId = req.user?.HotelId;
  if (!HotelId || !mongoose.isValidObjectId(HotelId)) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const ingredients = await IngredientModel.find({ HotelId }).sort({ name: 1 });
    const inventory = await InventoryModel.find({
      HotelId,
      ingredientId: { $in: ingredients.map((ingredient) => ingredient._id) },
    }).select('ingredientId quantity');
    const quantitiesByIngredientId = new Map(
      inventory.map((item) => [item.ingredientId.toString(), item.quantity])
    );

    return res.status(200).json({
      success: true,
      ingredients: ingredients.map((ingredient) => ({
        ...ingredient.toObject(),
        baseUnitQuantity: quantitiesByIngredientId.get(ingredient._id.toString()) ?? 0,
      })),
    });
  } catch (error) {
    console.error('Failed to get ingredients:', error);
    return res.status(500).json({ success: false, message: 'Unable to get ingredients' });
  }
};

export const deleteIngredient = async (req, res) => {
  const HotelId = req.user?.HotelId;
  const ingredientId = req.params?.ingredientId;

  try {
    if(!HotelId || !mongoose.isValidObjectId(HotelId)){
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if(!ingredientId || !mongoose.isValidObjectId(ingredientId)){
      return res.status(400).json({ success: false, message: 'Invalid ingredient ID' });
    }
    const ingredient = await IngredientModel.findOneAndUpdate(
      { HotelId, _id: ingredientId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );
    if(!ingredient){
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Ingredient deleted successfully',
      ingredient,
    });
  } catch (error) {
    console.error('Failed to delete ingredient:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete ingredient' });
  }
}

export const getInventory = async (req, res) => {
  const HotelId = req.user?.HotelId;
  if (!HotelId || !mongoose.isValidObjectId(HotelId)) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const inventory = await InventoryModel.find({ HotelId })
      .populate('ingredientId', 'name baseUnit lowStockThreshold isActive')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, inventory });
  } catch (error) {
    console.error('Failed to get inventory:', error);
    return res.status(500).json({ success: false, message: 'Unable to get inventory' });
  }
};

export const setInventory = async (req, res) => {
  const HotelId = req.user?.HotelId;
  if (!HotelId || !mongoose.isValidObjectId(HotelId)) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { ingredientId, quantity, averageCostPerBaseUnit } = req.body ?? {};
  if (
    !mongoose.isValidObjectId(ingredientId) ||
    typeof quantity !== 'number' ||
    !Number.isFinite(quantity) ||
    quantity < 0 ||
    (averageCostPerBaseUnit !== undefined &&
      (typeof averageCostPerBaseUnit !== 'number' ||
        !Number.isFinite(averageCostPerBaseUnit) ||
        averageCostPerBaseUnit < 0))
  ) {
    return res.status(400).json({
      success: false,
      message: 'Provide a valid ingredientId, non-negative quantity, and optional non-negative averageCostPerBaseUnit',
    });
  }

  try {
    const ingredientExists = await IngredientModel.exists({
      _id: ingredientId,
      HotelId,
      isActive: true,
    });
    if (!ingredientExists) {
      return res.status(404).json({
        success: false,
        message: 'Active ingredient not found for this hotel',
      });
    }

    const updates = { quantity };
    if (averageCostPerBaseUnit !== undefined) {
      updates.averageCostPerBaseUnit = averageCostPerBaseUnit;
    }

    const inventoryItem = await InventoryModel.findOneAndUpdate(
      { HotelId, ingredientId },
      { $set: updates, $setOnInsert: { HotelId, ingredientId } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('ingredientId', 'name baseUnit lowStockThreshold isActive');

    return res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      inventoryItem,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: 'Invalid inventory data' });
    }
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Inventory already exists for this ingredient; please retry the update',
      });
    }

    console.error('Failed to update inventory:', error);
    return res.status(500).json({ success: false, message: 'Unable to update inventory' });
  }
};