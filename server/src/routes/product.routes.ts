import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();

router.get('/', ProductController.getProducts);
router.get('/featured/sections', ProductController.getFeaturedSections);
router.get('/search/suggestions', ProductController.getSearchSuggestions);
router.get('/brands', ProductController.getBrands);
router.get('/meta/brands', ProductController.getBrands);
router.get('/:slugOrId', ProductController.getProductBySlugOrId);

export default router;
