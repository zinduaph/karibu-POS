import { Router } from 'express';
import * as menu from '../controllers/menuController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, requireRole('admin'), menu.addMenuItem);
router.get('/', authenticate, menu.getMenuItems);
router.delete('/:menuItemId', authenticate, requireRole('admin'), menu.deleteMenuItem);

export default router;
