import { Router } from 'express';
import * as inventory from '../controllers/inventoryController.js';
import * as menu from '../controllers/menuController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/add-menu-items', authenticate, requireRole('admin'), menu.addMenuItem);
router.post('/add-ingredients', authenticate, requireRole('admin'), inventory.addIngredient);
router.get('/ingredients', authenticate, requireRole('admin'), inventory.getIngredients);
router.get('/', authenticate, inventory.getInventory);
router.put('/', authenticate, requireRole('admin'), inventory.setInventory);
router.delete('/delete-ingredient/:ingredientId', authenticate, requireRole('admin'), inventory.deleteIngredient);
router.delete('/delete-menu-item/:menuItemId', authenticate, requireRole('admin'), menu.deleteMenuItem);

export default router;
