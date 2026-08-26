import app from './app';
import { env } from './config/environment';

const PORT = parseInt(env.PORT, 10) || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  =============================================================
  🧺  BIG BASKET — COMPLETE FULL-STACK GROCERY PLATFORM
  =============================================================
  🚀  Backend API Server running on http://127.0.0.1:${PORT}
  🛒  Brand: BIG BASKET (Grocery & Daily Essentials)
  🔒  Environment: ${env.NODE_ENV}
  📦  Database: Connected via Prisma ORM
  💳  Cash on Delivery: ENABLED (Native)
  ⚡  Razorpay Gateway: ${env.RAZORPAY_KEY_ID ? 'CONFIGURED' : 'READY (Set keys in .env)'}
  =============================================================
  `);
});
