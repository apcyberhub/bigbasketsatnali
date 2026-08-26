import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class ReviewController {
  static async getProductReviews(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const prodId = parseInt(productId, 10);

      const reviews = await prisma.review.findMany({
        where: {
          productId: prodId,
          isApproved: true,
        },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, 'Product reviews retrieved', reviews);
    } catch (error) {
      return sendError(res, 'Failed to fetch reviews', 500);
    }
  }

  static async submitReview(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { productId } = req.params;
      const { rating, comment } = req.body;
      const prodId = parseInt(productId, 10);

      const product = await prisma.product.findUnique({
        where: { id: prodId },
      });

      if (!product) return sendError(res, 'Product not found', 404);

      // Check if user purchased the product
      const purchasedOrder = await prisma.order.findFirst({
        where: {
          userId: req.user.id,
          orderStatus: 'DELIVERED',
          items: {
            some: { productId: prodId },
          },
        },
      });

      const isVerified = !!purchasedOrder;

      const review = await prisma.review.create({
        data: {
          productId: prodId,
          userId: req.user.id,
          rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
          comment: comment.trim(),
          isVerifiedPurchase: isVerified,
          isApproved: true,
        },
      });

      // Recalculate product rating and count
      const allReviews = await prisma.review.findMany({
        where: { productId: prodId, isApproved: true },
        select: { rating: true },
      });

      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = +(totalRating / allReviews.length).toFixed(1);

      await prisma.product.update({
        where: { id: prodId },
        data: {
          rating: avgRating,
          reviewCount: allReviews.length,
        },
      });

      return sendSuccess(res, 'Thank you! Your review has been published.', review, 201);
    } catch (error) {
      console.error('submitReview error:', error);
      return sendError(res, 'Failed to submit review', 500);
    }
  }
}
