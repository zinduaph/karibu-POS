import { Router } from 'express';
import * as c from '../controllers/reportController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/overview', c.overview);

export default router;
