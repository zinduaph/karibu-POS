import { Router } from 'express';
import * as onboarding from '../controllers/onboardingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/complete', authenticate, onboarding.markComplete);

export default router;
