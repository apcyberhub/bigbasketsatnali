import { Router } from 'express';
import { DeliveryController } from '../controllers/delivery.controller';

const router = Router();

router.get('/delivery-slots', DeliveryController.getDeliverySlots);

export default router;
