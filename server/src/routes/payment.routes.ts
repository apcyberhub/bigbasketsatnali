import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/config', PaymentController.getConfig);
router.post('/create-order', PaymentController.createPaymentOrder);
router.post('/verify', PaymentController.verifyPayment);

export default router;
