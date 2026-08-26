import { Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class WishlistController {
  static async getWishlist(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const wishlist = await prisma.wishlist.findMany({
        where: { userId: req.user.id },
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = wishlist.map((item) => ({
        id: item.id,
        productId: item.productId,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          brand: item.product.brand,
          unit: item.product.unit,
          price: item.product.price,
          mrp: item.product.mrp,
          discount: item.product.discount,
          mainImage: item.product.mainImage,
          stock: item.product.stock,
          rating: item.product.rating,
          reviewCount: item.product.reviewCount,
          isActive: item.product.isActive,
          category: item.product.category,
        },
        createdAt: item.createdAt,
      }));

      return sendSuccess(res, 'Wishlist retrieved', formatted);
    } catch (error) {
      return sendError(res, 'Failed to fetch wishlist', 500);
    }
  }

  static async toggleWishlist(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { productId } = req.params;
      const prodId = parseInt(productId, 10);

      const product = await prisma.product.findUnique({
        where: { id: prodId },
      });

      if (!product) return sendError(res, 'Product not found', 404);

      const existing = await prisma.wishlist.findUnique({
        where: {
          userId_productId: {
            userId: req.user.id,
            productId: prodId,
          },
        },
      });

      if (existing) {
        await prisma.wishlist.delete({
          where: { id: existing.id },
        });
        return sendSuccess(res, 'Removed from wishlist', { inWishlist: false, productId: prodId });
      } else {
        await prisma.wishlist.create({
          data: {
            userId: req.user.id,
            productId: prodId,
          },
        });
        return sendSuccess(res, 'Added to wishlist', { inWishlist: true, productId: prodId });
      }
    } catch (error) {
      return sendError(res, 'Failed to toggle wishlist', 500);
    }
  }

  static async removeFromWishlist(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { productId } = req.params;
      const prodId = parseInt(productId, 10);

      await prisma.wishlist.deleteMany({
        where: {
          userId: req.user.id,
          productId: prodId,
        },
      });

      return sendSuccess(res, 'Product removed from wishlist');
    } catch (error) {
      return sendError(res, 'Failed to remove from wishlist', 500);
    }
  }
}
