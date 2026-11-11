import asyncHandler from '../utils/asyncHandler.js';
import MenuItem from '../models/menuItem.js';
import Ingredient from '../models/ingredient.js';

export const addMenuItem = asyncHandler(async (req, res) => {
  const { name, category, price, recipe, trackInventory, isAvailable } = req.body;
  const restaurantId = req.user.restaurantId;

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }
  if (typeof category !== 'string' || !category.trim()) {
    return res.status(400).json({ message: 'Category is required' });
  }
  if (!Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ message: 'Valid non-negative price is required' });
  }

  const menuRecipe = Array.isArray(recipe) ? recipe : [];
  if ((trackInventory !== false) && menuRecipe.length === 0) {
    return res.status(400).json({ message: 'Add at least one ingredient to the recipe when inventory tracking is enabled' });
  }

  const ingredientIds = [];
  const seen = new Set();
  for (const item of menuRecipe) {
    if (
      !item ||
      !item.ingredientId ||
      !Number.isFinite(Number(item.quantity)) ||
      Number(item.quantity) <= 0 ||
      seen.has(String(item.ingredientId))
    ) {
      return res.status(400).json({ message: 'Each recipe item needs a unique ingredient and a positive quantity' });
    }
    seen.add(String(item.ingredientId));
    ingredientIds.push(item.ingredientId);
  }

  if (ingredientIds.length) {
    const count = await Ingredient.countDocuments({ _id: { $in: ingredientIds }, restaurantId, isActive: true });
    if (count !== ingredientIds.length) {
      return res.status(400).json({ message: 'Recipe ingredients must be active and belong to your restaurant' });
    }
  }

  const menuItem = await MenuItem.create({
    restaurantId,
    name: name.trim(),
    category: category.trim(),
    price: Number(price),
    ...(trackInventory !== undefined && { trackInventory: Boolean(trackInventory) }),
    ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
    ...(menuRecipe.length && { recipe: menuRecipe.map(({ ingredientId, quantity }) => ({ ingredientId, quantity: Number(quantity) })) }),
  });

  return res.status(201).json({ message: 'Menu item added successfully', menuItem });
});

export const getMenuItems = asyncHandler(async (req, res) => {
  const menuItems = await MenuItem.find({ restaurantId: req.user.restaurantId })
    .populate('recipe.ingredientId', 'name baseUnit')
    .sort({ name: 1 });
  return res.status(200).json({ menuItems });
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findOneAndDelete({ _id: req.params.menuItemId, restaurantId: req.user.restaurantId });
  if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
  return res.status(200).json({ success: true, message: 'Menu item deleted successfully' });
});
