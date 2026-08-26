import { Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class CartController {
  static async getCart(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      let cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  brand: true,
                  price: true,
                  mrp: true,
                  discount: true,
                  unit: true,
                  stock: true,
                  mainImage: true,
                  isActive: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId: req.user.id },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    brand: true,
                    price: true,
                    mrp: true,
                    discount: true,
                    unit: true,
                    stock: true,
                    mainImage: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        });
      }

      // Calculate totals
      let subtotal = 0;
      let totalMrp = 0;

      const formattedItems = cart.items.map((item) => {
        const itemSubtotal = item.product.price * item.quantity;
        const itemMrpTotal = item.product.mrp * item.quantity;
        subtotal += itemSubtotal;
        totalMrp += itemMrpTotal;

        return {
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          slug: item.product.slug,
          brand: item.product.brand,
          unit: item.product.unit,
          price: item.product.price,
          mrp: item.product.mrp,
          discount: item.product.discount,
          mainImage: item.product.mainImage,
          stock: item.product.stock,
          isActive: item.product.isActive,
          quantity: item.quantity,
          subtotal: +itemSubtotal.toFixed(2),
        };
      });

      const savings = +(totalMrp - subtotal).toFixed(2);
      const deliveryFee = subtotal >= 499 || subtotal === 0 ? 0 : 40;
      const tax = +(subtotal * 0.05).toFixed(2);
      const total = +(subtotal + deliveryFee + tax).toFixed(2);

      return sendSuccess(res, 'Cart retrieved', {
        id: cart.id,
        items: formattedItems,
        itemCount: formattedItems.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: +subtotal.toFixed(2),
        totalMrp: +totalMrp.toFixed(2),
        savings: Math.max(0, savings),
        deliveryFee,
        tax,
        total,
      });
    } catch (error) {
      console.error('getCart error:', error);
      return sendError(res, 'Failed to fetch cart', 500);
    }
  }

  static async addItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { productId, quantity = 1 } = req.body;
      const qty = Math.max(1, parseInt(quantity, 10) || 1);

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product || !product.isActive) {
        return sendError(res, 'Product is no longer available.', 404);
      }

      if (product.stock < qty) {
        return sendError(res, `Only ${product.stock} units available in stock.`, 400);
      }

      let cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId: req.user.id },
        });
      }

      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: product.id,
          },
        },
      });

      if (existingItem) {
        const newQty = existingItem.quantity + qty;
        if (product.stock < newQty) {
          return sendError(res, `Cannot add more. Max stock is ${product.stock}.`, 400);
        }

        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQty,
            price: product.price,
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            quantity: qty,
            price: product.price,
          },
        });
      }

      return CartController.getCart(req, res);
    } catch (error) {
      console.error('addItem error:', error);
      return sendError(res, 'Failed to add item to cart', 500);
    }
  }

  static async updateItemQuantity(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { id } = req.params;
      const { quantity } = req.body;
      const qty = parseInt(quantity, 10);

      const cartItem = await prisma.cartItem.findUnique({
        where: { id: parseInt(id, 10) },
        include: { cart: true, product: true },
      });

      if (!cartItem || cartItem.cart.userId !== req.user.id) {
        return sendError(res, 'Cart item not found', 404);
      }

      if (qty <= 0) {
        await prisma.cartItem.delete({
          where: { id: cartItem.id },
        });
      } else {
        if (cartItem.product.stock < qty) {
          return sendError(res, `Only ${cartItem.product.stock} units available in stock.`, 400);
        }

        await prisma.cartItem.update({
          where: { id: cartItem.id },
          data: {
            quantity: qty,
            price: cartItem.product.price,
          },
        });
      }

      return CartController.getCart(req, res);
    } catch (error) {
      console.error('updateItemQuantity error:', error);
      return sendError(res, 'Failed to update item quantity', 500);
    }
  }

  static async removeItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { id } = req.params;
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: parseInt(id, 10) },
        include: { cart: true },
      });

      if (!cartItem || cartItem.cart.userId !== req.user.id) {
        return sendError(res, 'Cart item not found', 404);
      }

      await prisma.cartItem.delete({
        where: { id: cartItem.id },
      });

      return CartController.getCart(req, res);
    } catch (error) {
      return sendError(res, 'Failed to remove item', 500);
    }
  }

  static async clearCart(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
      });

      if (cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      return sendSuccess(res, 'Cart cleared successfully');
    } catch (error) {
      return sendError(res, 'Failed to clear cart', 500);
    }
  }
}
