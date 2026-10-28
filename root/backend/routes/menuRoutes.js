import { Router } from 'express';
import { addMenuItems, deleteMenuItems, getMenuItems } from '../controller/InventoryController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const menuRouter = Router();

menuRouter.post('/', authenticate, requireRole('admin'), addMenuItems);
menuRouter.get('/', authenticate, requireRole('admin'), getMenuItems);
menuRouter.delete('/:menuItemId', authenticate, requireRole('admin'), deleteMenuItems);

export default menuRouter;
