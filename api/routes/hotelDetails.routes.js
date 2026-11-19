import { Router } from 'express';
import * as hotelDetails from '../controllers/hotelDetailsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { saveHotelDetails } from '../validators/hotelDetails.validators.js';

const router = Router();

router.use(authenticate, requireRole('admin'));
router.get('/', hotelDetails.getHotelDetails);
router.post('/', validate(saveHotelDetails), hotelDetails.updateHotelDetails);

export default router;
