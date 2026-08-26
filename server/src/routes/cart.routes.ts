import { Router } from 'express';
import { z } from 'zod';
import { CartController } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const addItemSchema = z.object({
  productId: z.number().int().positive('Valid product ID required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

const updateQuantitySchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

router.use(authenticate);

router.get('/', CartController.getCart);
router.post('/items', validate(addItemSchema), CartController.addItem);
router.put('/items/:id', validate(updateQuantitySchema), CartController.updateItemQuantity);
router.delete('/items/:id', CartController.removeItem);
router.delete('/', CartController.clearCart);

export default router;
