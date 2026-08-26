import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export class CategoryController {
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { products: { where: { isActive: true } } },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      const formatted = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        productCount: cat._count.products,
      }));

      return sendSuccess(res, 'Categories retrieved', formatted);
    } catch (error) {
      return sendError(res, 'Failed to fetch categories', 500);
    }
  }

  static async getCategoryBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          products: {
            where: { isActive: true },
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      if (!category) {
        return sendError(res, 'Category not found', 404);
      }

      return sendSuccess(res, 'Category details retrieved', category);
    } catch (error) {
      return sendError(res, 'Failed to fetch category details', 500);
    }
  }
}
