import { Router } from 'express';
import { z } from 'zod';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';

const router = Router();

// Protect ALL admin routes with authenticate + requireAdmin
router.use(authenticate, requireAdmin);

// 1. Dashboard
router.get('/dashboard', AdminController.getDashboardStats);

// 2. Products
router.get('/products', AdminController.getProducts);
router.post('/products', AdminController.createProduct);
router.put('/products/:id', AdminController.updateProduct);
router.delete('/products/:id', AdminController.deleteProduct);
router.post('/products/upload-image', upload.single('image'), AdminController.uploadProductImage);

// 3. Categories
router.get('/categories', AdminController.getCategories);
router.post('/categories', AdminController.createCategory);
router.put('/categories/:id', AdminController.updateCategory);
router.delete('/categories/:id', AdminController.deleteCategory);
router.post('/categories/upload-image', upload.single('image'), AdminController.uploadProductImage);

// 4. Inventory
router.get('/inventory', AdminController.getInventory);
router.patch('/inventory/:id/stock', AdminController.updateStock);

// 5. Orders
router.get('/orders', AdminController.getOrders);
router.put('/orders/:id/status', AdminController.updateOrderStatus);

// 6. Customers
router.get('/customers', AdminController.getCustomers);
router.patch('/customers/:id/toggle-status', AdminController.toggleCustomerStatus);

// 7. Coupons
router.get('/coupons', AdminController.getCoupons);
router.post('/coupons', AdminController.createCoupon);
router.put('/coupons/:id', AdminController.updateCoupon);
router.delete('/coupons/:id', AdminController.deleteCoupon);

// 8. Banners
router.get('/banners', AdminController.getBanners);
router.post('/banners', AdminController.createBanner);
router.put('/banners/:id', AdminController.updateBanner);
router.delete('/banners/:id', AdminController.deleteBanner);
router.post('/banners/upload-image', upload.single('image'), AdminController.uploadProductImage);

// 9. Delivery Slots
router.get('/delivery-slots', AdminController.getDeliverySlots);
router.post('/delivery-slots', AdminController.createDeliverySlot);
router.put('/delivery-slots/:id', AdminController.updateDeliverySlot);
router.delete('/delivery-slots/:id', AdminController.deleteDeliverySlot);

// 10. Reviews
router.get('/reviews', AdminController.getReviews);
router.patch('/reviews/:id/moderation', AdminController.toggleReviewApproval);
router.delete('/reviews/:id', AdminController.deleteReview);

// 11. Settings
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);

export default router;
