import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';

const router = Router();

router.get('/', CategoryController.getCategories);
router.get('/:slug', CategoryController.getCategoryBySlug);

export default router;
