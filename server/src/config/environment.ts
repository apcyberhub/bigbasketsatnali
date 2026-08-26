import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Fallback to server local .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().default('super_secret_jwt_key_bigbasket_grocery_2026_dev_mode'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  UPLOAD_DIR: z.string().default('uploads'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.string().default('admin@bigbasket.local'),
  ADMIN_PASSWORD: z.string().default('admin123'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
