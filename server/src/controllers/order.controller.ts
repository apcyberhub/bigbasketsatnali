import { Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { generateOrderNumber } from '../utils/orderNumber';

export class OrderController {
  static async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const {
        addressId,
        deliverySlot,
        couponCode,
        paymentMethod = 'COD',
        notes,
      } = req.body;

      if (!addressId) {
        return sendError(res, 'Please select a delivery address.', 400);
      }

      // 1. Verify address ownership
      const address = await prisma.address.findUnique({
        where: { id: parseInt(addressId, 10) },
      });

      if (!address || address.userId !== req.user.id) {
        return sendError(res, 'Invalid delivery address selected.', 404);
      }

      // 2. Fetch User Cart and Items
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        return sendError(res, 'Your shopping cart is empty.', 400);
      }

      // 3. Stock & Price Validation
      let subtotal = 0;
      for (const item of cart.items) {
        if (!item.product.isActive) {
          return sendError(res, `"${item.product.name}" is currently unavailable.`, 400);
        }
        if (item.product.stock < item.quantity) {
          return sendError(
            res,
            `Insufficient stock for "${item.product.name}". Only ${item.product.stock} available.`,
            400
          );
        }
        subtotal += item.product.price * item.quantity;
      }
      subtotal = +subtotal.toFixed(2);

      // 4. Validate Coupon
      let discount = 0;
      let validCoupon: any = null;

      if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
        const codeClean = couponCode.toUpperCase().trim();
        const coupon = await prisma.coupon.findUnique({
          where: { code: codeClean },
        });

        if (coupon && coupon.isActive) {
          const isNotExpired = !coupon.expiryDate || new Date(coupon.expiryDate) > new Date();
          const hasUsage = !coupon.usageLimit || coupon.usageCount < coupon.usageLimit;
          const meetsMinOrder = subtotal >= coupon.minOrderAmount;

          if (isNotExpired && hasUsage && meetsMinOrder) {
            validCoupon = coupon;
            if (coupon.discountType === 'PERCENTAGE') {
              discount = (subtotal * coupon.discountValue) / 100;
              if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
                discount = coupon.maxDiscountAmount;
              }
            } else {
              discount = coupon.discountValue;
            }
            discount = +Math.min(discount, subtotal).toFixed(2);
          }
        }
      }

      // 5. Calculate Fees & Final Total
      const deliveryFee = subtotal >= 499 || (validCoupon && validCoupon.code === 'FREEDEL') ? 0 : 40;
      const tax = +(subtotal * 0.05).toFixed(2);
      const total = +(subtotal - discount + deliveryFee + tax).toFixed(2);

      const orderNumber = generateOrderNumber();
      const addressSnapshot = JSON.stringify({
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        addressType: address.addressType,
      });

      // 6. Execute Atomic Prisma Transaction
      const order = await prisma.$transaction(async (tx) => {
        // A. Decrement product stocks
        for (const item of cart.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // B. If coupon was applied, increment usage
        if (validCoupon) {
          await tx.coupon.update({
            where: { id: validCoupon.id },
            data: { usageCount: { increment: 1 } },
          });
        }

        // C. Create Order
        const createdOrder = await tx.order.create({
          data: {
            userId: req.user!.id,
            orderNumber,
            subtotal,
            discount,
            deliveryFee,
            tax,
            total,
            couponCode: validCoupon ? validCoupon.code : null,
            paymentMethod,
            paymentStatus: paymentMethod === 'COD' ? 'COD_PENDING' : 'PENDING',
            orderStatus: 'PENDING',
            deliveryAddressSnapshot: addressSnapshot,
            deliverySlot: deliverySlot || 'Standard Delivery (10:00 AM - 12:00 PM)',
            notes: notes ? notes.trim() : null,
            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                productName: item.product.name,
                productBrand: item.product.brand,
                productUnit: item.product.unit,
                productImage: item.product.mainImage,
                price: item.product.price,
                mrp: item.product.mrp,
                quantity: item.quantity,
                subtotal: +(item.product.price * item.quantity).toFixed(2),
              })),
            },
            payments: {
              create: {
                transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                amount: total,
                currency: 'INR',
                status: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
                paymentMethod,
              },
            },
          },
          include: {
            items: true,
            payments: true,
          },
        });

        // D. Record coupon usage
        if (validCoupon) {
          await tx.couponUsage.create({
            data: {
              couponId: validCoupon.id,
              userId: req.user!.id,
              orderId: createdOrder.id,
              discountApplied: discount,
            },
          });
        }

        // E. Clear user's cart items
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        return createdOrder;
      });

      return sendSuccess(
        res,
        'Order placed successfully! Thank you for shopping with Big Basket.',
        {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          deliverySlot: order.deliverySlot,
          createdAt: order.createdAt,
        },
        201
      );
    } catch (error: any) {
      console.error('createOrder error:', error);
      return sendError(res, error.message || 'Failed to place order', 500);
    }
  }

  static async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        include: {
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = orders.map((order) => {
        let address = null;
        try {
          address = JSON.parse(order.deliveryAddressSnapshot);
        } catch (e) {
          address = {};
        }

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          subtotal: order.subtotal,
          discount: order.discount,
          deliveryFee: order.deliveryFee,
          tax: order.tax,
          total: order.total,
          couponCode: order.couponCode,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          deliverySlot: order.deliverySlot,
          deliveryAddress: address,
          itemCount: order.items.reduce((sum, it) => sum + it.quantity, 0),
          items: order.items,
          createdAt: order.createdAt,
        };
      });

      return sendSuccess(res, 'Customer orders retrieved', formatted);
    } catch (error) {
      console.error('getOrders error:', error);
      return sendError(res, 'Failed to fetch orders', 500);
    }
  }

  static async getOrderById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { id } = req.params;
      const isNumeric = !isNaN(parseInt(id, 10));

      const whereCondition = isNumeric
        ? { id: parseInt(id, 10) }
        : { orderNumber: id };

      const order = await prisma.order.findFirst({
        where: {
          ...whereCondition,
          userId: req.user.id, // Strictly verify ownership
        },
        include: {
          items: true,
          payments: true,
        },
      });

      if (!order) {
        return sendError(res, 'Order not found or permission denied', 404);
      }

      let address = {};
      try {
        address = JSON.parse(order.deliveryAddressSnapshot);
      } catch (e) {
        address = {};
      }

      return sendSuccess(res, 'Order details retrieved', {
        ...order,
        deliveryAddress: address,
      });
    } catch (error) {
      return sendError(res, 'Failed to fetch order details', 500);
    }
  }

  static async cancelOrder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { id } = req.params;
      const { reason = 'Cancelled by customer' } = req.body;
      const orderId = parseInt(id, 10);

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order || order.userId !== req.user.id) {
        return sendError(res, 'Order not found', 404);
      }

      // Customer can cancel ONLY if PENDING or CONFIRMED
      if (order.orderStatus !== 'PENDING' && order.orderStatus !== 'CONFIRMED') {
        return sendError(
          res,
          `Cannot cancel order with status "${order.orderStatus}". Please contact support.`,
          400
        );
      }

      // Execute transaction to cancel order and restore product stock
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Restore stock
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
            },
          });
        }

        return tx.order.update({
          where: { id: order.id },
          data: {
            orderStatus: 'CANCELLED',
            cancellationReason: reason,
          },
        });
      });

      return sendSuccess(res, 'Order cancelled successfully and stock restored.', updatedOrder);
    } catch (error) {
      console.error('cancelOrder error:', error);
      return sendError(res, 'Failed to cancel order', 500);
    }
  }
}
