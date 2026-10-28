import { Router } from 'express';
import { AddIngredient, addMenuItems, getIngredients, getInventory,deleteIngredient,deleteMenuItems, setInventory } from '../controller/InventoryController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const inventoryRouter = Router();
inventoryRouter.post('/add-menu-items', authenticate , requireRole('admin'), addMenuItems)
inventoryRouter.post('/add-ingredients', authenticate, requireRole('admin'), AddIngredient)
inventoryRouter.get('/ingredients', authenticate, requireRole('admin'), getIngredients)

inventoryRouter.get('/', authenticate, getInventory);
inventoryRouter.put('/', authenticate, requireRole('admin'), setInventory);
inventoryRouter.delete('/delete-ingredient/:ingredientId', authenticate, requireRole('admin'), deleteIngredient);
inventoryRouter.delete('/delete-menu-item/:menuItemId', authenticate, requireRole('admin'), deleteMenuItems);

export default inventoryRouter;
