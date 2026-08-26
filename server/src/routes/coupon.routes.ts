import { Router } from 'express';
import { z } from 'zod';
import { CouponController } from '../controllers/coupon.controller';
import { optionalAuthenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  orderAmount: z.number().positive('Order amount must be positive'),
});

router.get('/', optionalAuthenticate, CouponController.getAvailableCoupons);
router.post('/validate', optionalAuthenticate, validate(validateCouponSchema), CouponController.validateCoupon);

export default router;
