import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', WishlistController.getWishlist);
router.post('/:productId', WishlistController.toggleWishlist);
router.delete('/:productId', WishlistController.removeFromWishlist);

export default router;
