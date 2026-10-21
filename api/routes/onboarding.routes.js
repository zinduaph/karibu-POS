import { Router } from 'express';
import * as onboarding from '../controllers/onboardingController.js';
import * as product from '../controllers/productController.js';
import * as schema from '../validators/onboarding.validators.js';
import validate from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/status', authenticate, onboarding.getOnboardingStatus);

router.post('/admin/password', authenticate, requireRole('admin'), validate(schema.adminChangePassword), onboarding.adminChangePassword);

router.put('/restaurant/details', authenticate, requireRole('admin'), validate(schema.updateRestaurantDetails), onboarding.updateRestaurantDetails);

router.post('/complete', authenticate, onboarding.markComplete);

router.post('/products', authenticate, requireRole('admin'), validate(schema.addProduct), product.addProduct);
router.get('/products', authenticate, product.listProducts);
router.put('/products/:id', authenticate, requireRole('admin'), validate(schema.updateProduct), product.updateProduct);
router.delete('/products/:id', authenticate, requireRole('admin'), product.deleteProduct);

export default router;
