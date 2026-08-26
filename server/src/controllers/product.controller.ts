import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export class ProductController {
  static async getProducts(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '12',
        category,
        brand,
        search,
        minPrice,
        maxPrice,
        rating,
        minDiscount,
        inStockOnly,
        featured,
        sortBy = 'relevance',
      } = req.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        isActive: true,
      };

      if (category) {
        // Support category slug or category ID
        if (!isNaN(parseInt(category, 10))) {
          where.categoryId = parseInt(category, 10);
        } else {
          where.category = {
            slug: category,
          };
        }
      }

      if (brand) {
        const brands = brand.split(',').map((b) => b.trim());
        where.brand = { in: brands };
      }

      if (search && search.trim()) {
        const q = search.trim();
        where.OR = [
          { name: { contains: q } },
          { brand: { contains: q } },
          { sku: { contains: q } },
          { tags: { contains: q } },
          { description: { contains: q } },
        ];
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
      }

      if (rating) {
        where.rating = { gte: parseFloat(rating) };
      }

      if (minDiscount) {
        where.discount = { gte: parseFloat(minDiscount) };
      }

      if (inStockOnly === 'true') {
        where.stock = { gt: 0 };
      }

      if (featured === 'true') {
        where.isFeatured = true;
      }

      // Sorting
      let orderBy: any = { id: 'desc' };
      if (sortBy === 'price-low') orderBy = { price: 'asc' };
      if (sortBy === 'price-high') orderBy = { price: 'desc' };
      if (sortBy === 'newest') orderBy = { createdAt: 'desc' };
      if (sortBy === 'rating') orderBy = { rating: 'desc' };
      if (sortBy === 'discount') orderBy = { discount: 'desc' };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
            images: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy,
          skip,
          take: limitNum,
        }),
        prisma.product.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return sendSuccess(res, 'Products retrieved successfully', products, 200, {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      });
    } catch (error) {
      console.error('getProducts error:', error);
      return sendError(res, 'Failed to fetch products', 500);
    }
  }

  static async getProductBySlugOrId(req: Request, res: Response) {
    try {
      const { slugOrId } = req.params;

      const isNumeric = /^\d+$/.test(slugOrId);
      const whereCondition = isNumeric
        ? { id: parseInt(slugOrId, 10) }
        : { slug: slugOrId };

      const product = await prisma.product.findFirst({
        where: {
          ...whereCondition,
          isActive: true,
        },
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          reviews: {
            where: { isApproved: true },
            include: {
              user: {
                select: { name: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!product) {
        return sendError(res, 'Product not found', 404);
      }

      // Fetch related products in the same category
      const relatedProducts = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
          isActive: true,
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        take: 6,
      });

      return sendSuccess(res, 'Product details retrieved', {
        product,
        relatedProducts,
      });
    } catch (error) {
      console.error('getProductBySlugOrId error:', error);
      return sendError(res, 'Failed to fetch product details', 500);
    }
  }

  static async getSearchSuggestions(req: Request, res: Response) {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string' || !q.trim()) {
        return sendSuccess(res, 'No query provided', []);
      }

      const term = q.trim();

      const [products, categories] = await Promise.all([
        prisma.product.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: term } },
              { brand: { contains: term } },
              { tags: { contains: term } },
            ],
          },
          select: {
            id: true,
            name: true,
            slug: true,
            brand: true,
            price: true,
            mrp: true,
            mainImage: true,
            unit: true,
          },
          take: 6,
        }),
        prisma.category.findMany({
          where: {
            isActive: true,
            name: { contains: term },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
          take: 3,
        }),
      ]);

      return sendSuccess(res, 'Search suggestions', {
        products,
        categories,
      });
    } catch (error) {
      return sendError(res, 'Failed to fetch suggestions', 500);
    }
  }

  static async getFeaturedSections(req: Request, res: Response) {
    try {
      const [bestSellers, freshPicks, deals, newArrivals] = await Promise.all([
        prisma.product.findMany({
          where: { isActive: true, isFeatured: true },
          include: { category: true },
          take: 8,
          orderBy: { rating: 'desc' },
        }),
        prisma.product.findMany({
          where: {
            isActive: true,
            category: { slug: 'fruits-vegetables' },
          },
          include: { category: true },
          take: 8,
        }),
        prisma.product.findMany({
          where: { isActive: true, discount: { gte: 15 } },
          include: { category: true },
          take: 8,
          orderBy: { discount: 'desc' },
        }),
        prisma.product.findMany({
          where: { isActive: true },
          include: { category: true },
          take: 8,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return sendSuccess(res, 'Featured sections retrieved', {
        bestSellers,
        freshPicks,
        deals,
        newArrivals,
      });
    } catch (error) {
      return sendError(res, 'Failed to fetch featured sections', 500);
    }
  }

  static async getBrands(req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { brand: true },
        distinct: ['brand'],
      });

      const brands = products.map((p) => p.brand).filter(Boolean);
      return sendSuccess(res, 'Brands retrieved', brands);
    } catch (error) {
      return sendError(res, 'Failed to fetch brands', 500);
    }
  }
}
