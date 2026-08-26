import { Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class CouponController {
  static async validateCoupon(req: AuthenticatedRequest, res: Response) {
    try {
      const { code, orderAmount } = req.body;
      const subtotal = parseFloat(orderAmount);

      if (!code || typeof code !== 'string') {
        return sendError(res, 'Coupon code is required', 400);
      }

      if (isNaN(subtotal) || subtotal <= 0) {
        return sendError(res, 'Valid order amount is required', 400);
      }

      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase().trim() },
      });

      if (!coupon || !coupon.isActive) {
        return sendError(res, 'Invalid or inactive coupon code.', 404);
      }

      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        return sendError(res, 'This coupon has expired.', 400);
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return sendError(res, 'Coupon usage limit has been reached.', 400);
      }

      if (subtotal < coupon.minOrderAmount) {
        return sendError(
          res,
          `Minimum order value for this coupon is ₹${coupon.minOrderAmount}. Add ₹${(
            coupon.minOrderAmount - subtotal
          ).toFixed(2)} more to apply!`,
          400
        );
      }

      // Check if user has already used this single-use coupon if authenticated
      if (req.user) {
        const usageCount = await prisma.couponUsage.count({
          where: {
            couponId: coupon.id,
            userId: req.user.id,
          },
        });

        if (usageCount > 0 && coupon.code === 'WELCOME20') {
          return sendError(res, 'You have already used the WELCOME20 coupon on your account.', 400);
        }
      }

      let discount = 0;
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
          discount = coupon.maxDiscountAmount;
        }
      } else {
        discount = coupon.discountValue;
      }

      discount = +Math.min(discount, subtotal).toFixed(2);

      return sendSuccess(res, `Coupon ${coupon.code} applied successfully! You saved ₹${discount}`, {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount,
        description: coupon.description,
      });
    } catch (error) {
      console.error('validateCoupon error:', error);
      return sendError(res, 'Failed to validate coupon', 500);
    }
  }

  static async getAvailableCoupons(req: AuthenticatedRequest, res: Response) {
    try {
      const coupons = await prisma.coupon.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          description: true,
          discountType: true,
          discountValue: true,
          minOrderAmount: true,
          maxDiscountAmount: true,
        },
      });

      return sendSuccess(res, 'Available coupons retrieved', coupons);
    } catch (error) {
      return sendError(res, 'Failed to fetch coupons', 500);
    }
  }
}
