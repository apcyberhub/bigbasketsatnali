import { Router } from 'express';
import { z } from 'zod';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const createOrderSchema = z.object({
  addressId: z.number().int().positive('Delivery address is required'),
  deliverySlot: z.string().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['COD', 'ONLINE']).default('COD'),
  notes: z.string().optional(),
});

router.use(authenticate);

router.post('/', validate(createOrderSchema), OrderController.createOrder);
router.get('/', OrderController.getOrders);
router.get('/:id', OrderController.getOrderById);
router.post('/:id/cancel', OrderController.cancelOrder);

export default router;
