import { Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma } from '../config/prisma';
import { env } from '../config/environment';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

let razorpayInstance: Razorpay | null = null;
if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export class PaymentController {
  static async getConfig(req: AuthenticatedRequest, res: Response) {
    return sendSuccess(res, 'Payment configuration', {
      isRazorpayAvailable: !!razorpayInstance,
      keyId: env.RAZORPAY_KEY_ID || null,
      isCodAvailable: true,
    });
  }

  static async createPaymentOrder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { orderId } = req.body;
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId, 10) },
      });

      if (!order || order.userId !== req.user.id) {
        return sendError(res, 'Order not found', 404);
      }

      if (order.paymentStatus === 'PAID') {
        return sendError(res, 'This order has already been paid.', 400);
      }

      if (!razorpayInstance) {
        return sendSuccess(
          res,
          'Online payment is not configured. Please use Cash on Delivery for this order.',
          {
            isMock: true,
            orderId: order.id,
            amount: order.total,
            currency: 'INR',
          }
        );
      }

      const options = {
        amount: Math.round(order.total * 100), // in paise
        currency: 'INR',
        receipt: `receipt_${order.orderNumber}`,
        notes: {
          orderId: order.id.toString(),
          orderNumber: order.orderNumber,
          customerEmail: req.user.email,
        },
      };

      const razorpayOrder = await razorpayInstance.orders.create(options);

      // Record / Update Payment record
      await prisma.payment.create({
        data: {
          orderId: order.id,
          transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          razorpayOrderId: razorpayOrder.id,
          amount: order.total,
          currency: 'INR',
          status: 'PENDING',
          paymentMethod: 'RAZORPAY',
        },
      });

      return sendSuccess(res, 'Razorpay order created', {
        keyId: env.RAZORPAY_KEY_ID,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderNumber: order.orderNumber,
        customerName: req.user.name,
        customerEmail: req.user.email,
      });
    } catch (error: any) {
      console.error('createPaymentOrder error:', error);
      return sendError(res, 'Failed to create payment order', 500);
    }
  }

  static async verifyPayment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const {
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId, 10) },
      });

      if (!order || order.userId !== req.user.id) {
        return sendError(res, 'Order not found', 404);
      }

      if (!env.RAZORPAY_KEY_SECRET) {
        // Fallback for offline dev
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            orderStatus: 'CONFIRMED',
          },
        });
        return sendSuccess(res, 'Payment verified successfully');
      }

      // Compute HMAC-SHA256 signature verification
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      const isAuthentic = expectedSignature === razorpay_signature;

      if (!isAuthentic) {
        await prisma.payment.updateMany({
          where: { orderId: order.id },
          data: { status: 'FAILED' },
        });
        return sendError(res, 'Payment signature verification failed.', 400);
      }

      // Update Order & Payment
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            orderStatus: 'CONFIRMED',
          },
        }),
        prisma.payment.create({
          data: {
            orderId: order.id,
            transactionId: `TXN-${Date.now()}`,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            amount: order.total,
            currency: 'INR',
            status: 'PAID',
            paymentMethod: 'RAZORPAY',
          },
        }),
      ]);

      return sendSuccess(res, 'Payment verified and order confirmed successfully!');
    } catch (error) {
      console.error('verifyPayment error:', error);
      return sendError(res, 'Failed to verify payment', 500);
    }
  }
}
