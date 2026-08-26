import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/environment';
import { errorHandler } from './middleware/errorHandler';
import { sendSuccess } from './utils/response';

// Import Routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import cartRoutes from './routes/cart.routes';
import wishlistRoutes from './routes/wishlist.routes';
import addressRoutes from './routes/address.routes';
import couponRoutes from './routes/coupon.routes';
import deliveryRoutes from './routes/delivery.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import reviewRoutes from './routes/review.routes';
import bannerRoutes from './routes/banner.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// 1. Security & Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [
      env.CLIENT_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
    ],
    credentials: true,
  })
);

// Rate limiting (skipped in development and localhost for smooth experience)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'development' ? 50000 : 2000,
  skip: (req) =>
    env.NODE_ENV === 'development' ||
    req.ip === '127.0.0.1' ||
    req.ip === '::1' ||
    req.ip === '::ffff:127.0.0.1',
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after a few minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 2. Static File Serving (Uploads & Assets)
const rootDir = path.resolve(__dirname, '../../');
const serverDir = path.resolve(__dirname, '../');

app.use('/uploads', express.static(path.join(rootDir, 'uploads')));
app.use('/uploads', express.static(path.join(serverDir, 'uploads')));
app.use('/assets', express.static(path.join(rootDir, 'assets')));
app.use('/assets', express.static(path.join(rootDir, 'client/public/assets')));

// 3. API Routes
app.get('/api/health', (req, res) => {
  return sendSuccess(res, 'Big Basket API is running healthy', {
    brand: 'BIG BASKET',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api', deliveryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', reviewRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);

// 4. Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// 5. Global Central Error Handler
app.use(errorHandler);

export default app;
