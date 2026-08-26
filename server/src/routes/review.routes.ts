import { Router } from 'express';
import { z } from 'zod';
import { ReviewController } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const reviewSchema = z.object({
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(3, 'Review comment must be at least 3 characters'),
});

router.get('/products/:productId/reviews', ReviewController.getProductReviews);
router.post(
  '/products/:productId/reviews',
  authenticate,
  validate(reviewSchema),
  ReviewController.submitReview
);

export default router;
