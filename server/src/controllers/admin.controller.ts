import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export class AdminController {
  // ----------------------------------------------------------------------------
  // 1. DASHBOARD ANALYTICS
  // ----------------------------------------------------------------------------
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalCustomers,
        totalProducts,
        lowStockProducts,
        orders,
        recentOrders,
        lowStockList,
      ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({
          where: { orderStatus: { in: ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY'] } },
        }),
        prisma.order.count({ where: { orderStatus: 'DELIVERED' } }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({
          where: { isActive: true, stock: { lte: 10 } },
        }),
        prisma.order.findMany({
          where: { orderStatus: { not: 'CANCELLED' } },
          select: { total: true, createdAt: true },
        }),
        prisma.order.findMany({
          include: {
            user: { select: { name: true, email: true, phone: true } },
            items: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        prisma.product.findMany({
          where: { isActive: true, stock: { lte: 10 } },
          include: { category: true },
          take: 10,
        }),
      ]);

      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
      const todayRevenue = orders
        .filter((o) => new Date(o.createdAt) >= today)
        .reduce((sum, o) => sum + o.total, 0);

      // 7-day sales graph
      const last7Days: { date: string; revenue: number; orders: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        const dayOrders = orders.filter(
          (o) => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) <= dayEnd
        );

        last7Days.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: +dayOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2),
          orders: dayOrders.length,
        });
      }

      return sendSuccess(res, 'Admin dashboard stats retrieved', {
        metrics: {
          totalRevenue: +totalRevenue.toFixed(2),
          todayRevenue: +todayRevenue.toFixed(2),
          totalOrders,
          pendingOrders,
          deliveredOrders,
          totalCustomers,
          totalProducts,
          lowStockCount: lowStockProducts,
        },
        salesChart: last7Days,
        recentOrders,
        lowStockProducts: lowStockList,
      });
    } catch (error) {
      console.error('getDashboardStats error:', error);
      return sendError(res, 'Failed to fetch dashboard stats', 500);
    }
  }

  // ----------------------------------------------------------------------------
  // 2. PRODUCT MANAGEMENT
  // ----------------------------------------------------------------------------
  static async getProducts(req: Request, res: Response) {
    try {
      const { search, category, stockStatus, page = '1', limit = '50' } = req.query as any;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 50);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (search && search.trim()) {
        const q = search.trim();
        where.OR = [
          { name: { contains: q } },
          { brand: { contains: q } },
          { sku: { contains: q } },
        ];
      }

      if (category) {
        where.categoryId = parseInt(category, 10);
      }

      if (stockStatus === 'OUT_OF_STOCK') {
        where.stock = 0;
      } else if (stockStatus === 'LOW_STOCK') {
        where.stock = { gt: 0, lte: 10 };
      } else if (stockStatus === 'IN_STOCK') {
        where.stock = { gt: 10 };
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { category: true },
          orderBy: { id: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.product.count({ where }),
      ]);

      return sendSuccess(res, 'Products retrieved', products, 200, {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      return sendError(res, 'Failed to fetch products', 500);
    }
  }

  static async createProduct(req: Request, res: Response) {
    try {
      const {
        name,
        slug,
        categoryId,
        brand,
        sku,
        price,
        mrp,
        discount,
        unit,
        weight,
        stock,
        lowStockThreshold,
        mainImage,
        isFeatured = false,
        isActive = true,
        tags,
        shortDescription,
        description,
      } = req.body;

      const cleanSlug =
        slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      const calcDiscount =
        discount !== undefined
          ? parseFloat(discount)
          : mrp > price
          ? +(((mrp - price) / mrp) * 100).toFixed(1)
          : 0;

      const product = await prisma.product.create({
        data: {
          name: name.trim(),
          slug: cleanSlug,
          categoryId: parseInt(categoryId, 10),
          brand: brand.trim(),
          sku: sku.trim().toUpperCase(),
          price: parseFloat(price),
          mrp: parseFloat(mrp),
          discount: calcDiscount,
          unit: unit || '1 piece',
          weight: weight || null,
          stock: parseInt(stock, 10) || 0,
          lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
          mainImage: mainImage || null,
          isFeatured: !!isFeatured,
          isActive: isActive !== undefined ? !!isActive : true,
          tags: tags || null,
          shortDescription: shortDescription || null,
          description: description || null,
        },
      });

      return sendSuccess(res, 'Product created successfully', product, 201);
    } catch (error: any) {
      console.error('createProduct error:', error);
      return sendError(res, error.message || 'Failed to create product', 500);
    }
  }

  static async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const prodId = parseInt(id, 10);

      const updatePayload: any = {};
      if (data.name !== undefined) updatePayload.name = data.name.trim();
      if (data.slug !== undefined) updatePayload.slug = data.slug.trim();
      if (data.categoryId !== undefined) updatePayload.categoryId = parseInt(data.categoryId, 10);
      if (data.brand !== undefined) updatePayload.brand = data.brand.trim();
      if (data.sku !== undefined) updatePayload.sku = data.sku.trim().toUpperCase();
      if (data.price !== undefined) updatePayload.price = parseFloat(data.price);
      if (data.mrp !== undefined) updatePayload.mrp = parseFloat(data.mrp);
      if (data.discount !== undefined) updatePayload.discount = parseFloat(data.discount);
      if (data.unit !== undefined) updatePayload.unit = data.unit;
      if (data.weight !== undefined) updatePayload.weight = data.weight;
      if (data.stock !== undefined) updatePayload.stock = parseInt(data.stock, 10);
      if (data.lowStockThreshold !== undefined)
        updatePayload.lowStockThreshold = parseInt(data.lowStockThreshold, 10);
      if (data.mainImage !== undefined) updatePayload.mainImage = data.mainImage;
      if (data.isFeatured !== undefined) updatePayload.isFeatured = !!data.isFeatured;
      if (data.isActive !== undefined) updatePayload.isActive = !!data.isActive;
      if (data.tags !== undefined) updatePayload.tags = data.tags;
      if (data.shortDescription !== undefined) updatePayload.shortDescription = data.shortDescription;
      if (data.description !== undefined) updatePayload.description = data.description;

      const updated = await prisma.product.update({
        where: { id: prodId },
        data: updatePayload,
      });

      return sendSuccess(res, 'Product updated successfully', updated);
    } catch (error) {
      console.error('updateProduct error:', error);
      return sendError(res, 'Failed to update product', 500);
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const prodId = parseInt(id, 10);

      await prisma.product.delete({
        where: { id: prodId },
      });

      return sendSuccess(res, 'Product deleted successfully');
    } catch (error) {
      return sendError(res, 'Failed to delete product', 500);
    }
  }

  static async uploadProductImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return sendError(res, 'No image file uploaded', 400);
      }

      const imageUrl = `uploads/products/${req.file.filename}`;
      return sendSuccess(res, 'Image uploaded successfully', { imageUrl });
    } catch (error) {
      return sendError(res, 'Failed to upload image', 500);
    }
  }

  // ----------------------------------------------------------------------------
  // 3. CATEGORY MANAGEMENT
  // ----------------------------------------------------------------------------
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: { select: { products: true } },
        },
        orderBy: { sortOrder: 'asc' },
      });

      return sendSuccess(res, 'Categories retrieved', categories);
    } catch (error) {
      return sendError(res, 'Failed to fetch categories', 500);
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const { name, slug, description, image, icon, isActive = true, sortOrder = 0 } = req.body;

      const cleanSlug =
        slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          slug: cleanSlug,
          description: description || null,
          image: image || null,
          icon: icon || 'ShoppingBag',
          isActive: !!isActive,
          sortOrder: parseInt(sortOrder, 10) || 0,
        },
      });

      return sendSuccess(res, 'Category created successfully', category, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create category', 500);
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const catId = parseInt(id, 10);
      const data = req.body;

      const updated = await prisma.category.update({
        where: { id: catId },
        data: {
          name: data.name ? data.name.trim() : undefined,
          slug: data.slug ? data.slug.trim() : undefined,
          description: data.description !== undefined ? data.description : undefined,
          image: data.image !== undefined ? data.image : undefined,
          icon: data.icon !== undefined ? data.icon : undefined,
          isActive: data.isActive !== undefined ? !!data.isActive : undefined,
          sortOrder: data.sortOrder !== undefined ? parseInt(data.sortOrder, 10) : undefined,
        },
      });

      return sendSuccess(res, 'Category updated successfully', updated);
    } catch (error) {
      return sendError(res, 'Failed to update category', 500);
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const catId = parseInt(id, 10);

      const productCount = await prisma.product.count({ where: { categoryId: catId } });
      if (productCount > 0) {
        return sendError(
          res,
          `Cannot delete category containing ${productCount} products. Please reassign or delete the products first.`,
          400
        );
      }

      await prisma.category.delete({ where: { id: catId } });
      return sendSuccess(res, 'Category deleted successfully');
    } catch (error) {
      return sendError(res, 'Failed to delete category', 500);
    }
  }

  // ----------------------------------------------------------------------------
  // 4. INVENTORY MANAGEMENT
  // ----------------------------------------------------------------------------
  static async getInventory(req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          brand: true,
          price: true,
          mrp: true,
          stock: true,
          lowStockThreshold: true,
          isActive: true,
          updatedAt: true,
          category: { select: { name: true } },
        },
        orderBy: [{ stock: 'asc' }, { name: 'asc' }],
      });

      const inventory = products.map((p) => {
        let status = 'IN_STOCK';
        if (p.stock === 0) status = 'OUT_OF_STOCK';
        else if (p.stock <= p.lowStockThreshold) status = 'LOW_STOCK';

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          brand: p.brand,
          category: p.category.name,
          stock: p.stock,
          lowStockThreshold: p.lowStockThreshold,
          status,
          updatedAt: p.updatedAt,
        };
      });

      return sendSuccess(res, 'Inventory retrieved', inventory);
    } catch (error) {
      return sendError(res, 'Failed to fetch inventory', 500);
    }
  }

  static async updateStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { stock, lowStockThreshold } = req.body;
      const prodId = parseInt(id, 10);

      const updated = await prisma.product.update({
        where: { id: prodId },
        data: {
          stock: stock !== undefined ? Math.max(0, parseInt(stock, 10)) : undefined,
          lowStockThreshold:
            lowStockThreshold !== undefined
              ? Math.max(1, parseInt(lowStockThreshold, 10))
              : undefined,
        },
      });

      return sendSuccess(res, `Stock updated for ${updated.name}`, updated);
    } catch (error) {
      return sendError(res, 'Failed to update stock', 500);
    }
  }

  // ----------------------------------------------------------------------------
  // 5. ORDER MANAGEMENT
  // ----------------------------------------------------------------------------
  static async getOrders(req: Request, res: Response) {
    try {
      const { search, orderStatus, paymentStatus, page = '1', limit = '50' } = req.query as any;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 50);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (orderStatus) where.orderStatus = orderStatus;
      if (paymentStatus) where.paymentStatus = paymentStatus;

      if (search && search.trim()) {
        const q = search.trim();
        where.OR = [
          { orderNumber: { contains: q } },
          { user: { name: { contains: q } } },
          { user: { email: { contains: q } } },
          { user: { phone: { contains: q } } },
        ];
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: { select: { name: true, email: true, phone: true } },
            items: true,
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.order.count({ where }),
      ]);

      const formatted = orders.map((o) => {
        let address = {};
        try {
          address = JSON.parse(o.deliveryAddressSnapshot);
        } catch (e) {
          address = {};
        }
        return {
          ...o,
          deliveryAddress: address,
        };
      });

      return sendSuccess(res, 'Orders retrieved', formatted, 200, {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      return sendError(res, 'Failed to fetch orders', 500);
    }
  }

  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { orderStatus, paymentStatus } = req.body;
      const orderId = parseInt(id, 10);

      const updateData: any = {};
      if (orderStatus) updateData.orderStatus = orderStatus;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;

      const order = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
      });

      return sendSuccess(res, `Order #${order.orderNumber} updated to ${order.orderStatus}`, order);
    } catch (error) {
      return sendError(res, 'Failed to update order status', 500);
    }
  }

  // ----------------------------------------------------------------------------
  // 6. CUSTOMER MANAGEMENT
  // ----------------------------------------------------------------------------
  static async getCustomers(req: Request, res: Response) {
    try {
      const customers = await prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true } },
          orders: {
            where: { paymentStatus: 'PAID' },
            select: { total: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        isActive: c.isActive,
        createdAt: c.createdAt,
        orderCount: c._count.orders,
        totalSpend: +c.orders.reduce((sum, o) => sum + o.total, 0).toFixed(2),
      }));

      return sendSuccess(res, 'Customers retrieved', formatted);
    } catch (error) {
      return sendError(res, 'Failed to fetch customers', 500);
    }
  }

  static async toggleCustomerStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = parseInt(id, 10);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return sendError(res, 'Customer not found', 404);

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
        select: { id: true, name: true, email: true, isActive: true },
      });

      return sendSuccess(
        res,
        `Customer account ${updated.isActive ? 'activated' : 'deactivated'}`,
        updated
      );
    } catch (error) {
      return sendError(res, 'Failed to toggle customer status', 500);
    }
  }

  // ----------------------------------------------------------------------------
  // 7. COUPON MANAGEMENT
  // ----------------------------------------------------------------------------
  static async getCoupons(req: Request, res: Response) {
    try {
      const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return sendSuccess(res, 'Coupons retrieved', coupons);
    } catch (error) {
      return sendError(res, 'Failed to fetch coupons', 500);
    }
  }

  static async createCoupon(req: Request, res: Response) {
    try {
      const {
        code,
        description,
        discountType = 'PERCENTAGE',
        discountValue,
        minOrderAmount = 0,
        maxDiscountAmount,
        usageLimit,
        expiryDate,
        isActive = true,
      } = req.body;

      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase().trim(),
          description: description || null,
          discountType,
          discountValue: parseFloat(discountValue),
          minOrderAmount: parseFloat(minOrderAmount) || 0,
          maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
          usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          isActive: !!isActive,
        },
      });

      return sendSuccess(res, 'Coupon created successfully', coupon, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create coupon', 500);
    }
  }

  static async updateCoupon(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const coupId = parseInt(id, 10);
      const data = req.body;

      const updated = await prisma.coupon.update({
        where: { id: coupId },
        data: {
          code: data.code ? data.code.toUpperCase().trim() : undefined,
          description: data.description !== undefined ? data.description : undefined,
          discountType: data.discountType || undefined,
          discountValue: data.discountValue !== undefined ? parseFloat(data.discountValue) : undefined,
          minOrderAmount: data.minOrderAmount !== undefined ? parseFloat(data.minOrderAmount) : undefined,
          maxDiscountAmount: data.maxDiscountAmount !== undefined ? (data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : null) : undefined,
          usageLimit: data.usageLimit !== undefined ? (data.usageLimit ? parseInt(data.usageLimit, 10) : null) : undefined,
          expiryDate: data.expiryDate !== undefined ? (data.expiryDate ? new Date(data.expiryDate) : null) : undefined,
          isActive: data.isActive !== undefined ? !!data.isActive : undefined,
        },
      });

      return sendSuccess(res, 'Coupon updated successfully', updated);
    } catch (error) {
      return sendError(res, 'Failed to update coupon', 500);
    }
  }

  static async deleteCoupon(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.coupon.delete({ where: { id: parseInt(id, 10) } });
      return sendSuccess(res, 'Coupon deleted successfully');
    } catch (error) {
      return sendError(res, 'Failed to delete coupon', 500);
    }
  }

  // ----------------------------------------------------------------------------
  // 8. BANNER MANAGEMENT
  // ----------------------------------------------------------------------------
  static async getBanners(req: Request, res: Response) {
    try {
      const banners = await prisma.banner.findMany({
        orderBy: { sortOrder: 'asc' },
      });
      return sendSuccess(res, 'Banners retrieved', banners);
    } catch (error) {
      return sendError(res, 'Failed to fetch banners', 500);
    }
  }

  static async createBanner(req: Request, res: Response) {
    try {
      const { title, subtitle, image, ctaText = 'Shop Now', linkUrl = '/products', sortOrder = 0, isActive = true } = req.body;

      const banner = await prisma.banner.create({
        data: {
          title: title.trim(),
          subtitle: subtitle || null,
          image,
          ctaText,
          linkUrl,
          sortOrder: parseInt(sortOrder, 10) || 0,
          isActive: !!isActive,
        },
      });

      return sendSuccess(res, 'Banner created successfully', banner, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create banner', 500);
    }
  }

  static async updateBanner(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const banId = parseInt(id, 10);
      const data = req.body;

      const updated = await prisma.banner.update({
        where: { id: banId },
        data: {
          title: data.title ? data.title.trim() : undefined,
          subtitle: data.subtitle !== undefined ? data.subtitle : undefined,
          image: data.image !== undefined ? data.image : undefined,
          ctaText: data.ctaText || undefined,
          linkUrl: data.linkUrl || undefined,
          sortOrder: data.sortOrder !== undefined ? parseInt(data.sortOrder, 10) : undefined,
          isActive: data.isActive !== undefined ? !!data.isActive : undefined,
        },
      });

      return sendSuccess(res, 'Banner updated successfully', updated);
    } catch (error) {
      return sendError(res, 'Failed to update banner', 500);
    }
  }

  static async deleteBanner(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.banner.delete({ where: { id: parseInt(id, 10) } });
      return sendSuccess(res, 'Banner deleted successfully');
    } catch (error) {
      return sendError(res, 'Failed to delete banner', 500);
    }
  }

  // ----------------------------------------------------------------------------
  // 9. DELIVERY SLOTS
  // ----------------------------------------------------------------------------
  static async getDeliverySlots(req: Request, res: Response) {
    try {
      const slots = await prisma.deliverySlot.findMany({
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });
      return sendSuccess(res, 'Delivery slots retrieved', slots);
    } catch (error) {
      return sendError(res, 'Failed to fetch slots', 500);
    }
  }

  static async createDeliverySlot(req: Request, res: Response) {
    try {
      const { date, startTime, endTime, capacity = 30, isActive = true } = req.body;

      const slot = await prisma.deliverySlot.create({
        data: {
          date: date.trim().toUpperCase(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          capacity: parseInt(capacity, 10) || 30,
          bookedCount: 0,
          isActive: !!isActive,
        },
      });

      return sendSuccess(res, 'Delivery slot created', slot, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create slot', 500);
    }
  }

  static async updateDeliverySlot(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const slotId = parseInt(id, 10);
      const data = req.body;

      const updated = await prisma.deliverySlot.update({
        where: { id: slotId },
        data: {
          date: data.date ? data.date.trim().toUpperCase() : undefined,
          startTime: data.startTime ? data.startTime.trim() : undefined,
          endTime: data.endTime ? data.endTime.trim() : undefined,
          capacity: data.capacity !== undefined ? parseInt(data.capacity, 10) : undefined,
          bookedCount: data.bookedCount !== undefined ? parseInt(data.bookedCount, 10) : undefined,
          isActive: data.isActive !== undefined ? !!data.isActive : undefined,
        },
      });

      return sendSuccess(res, 'Delivery slot updated', updated);
    } catch (error) {
      return sendError(res, 'Failed to update slot', 500);
    }
  }

  static async deleteDeliverySlot(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.deliverySlot.delete({ where: { id: parseInt(id, 10) } });
      return sendSuccess(res, 'Delivery slot deleted');
    } catch (error) {
      return sendError(res, 'Failed to delete slot', 500);
    }
  }

  // ----------------------------------------------------------------------------
  // 10. REVIEWS MODERATION
  // ----------------------------------------------------------------------------
  static async getReviews(req: Request, res: Response) {
    try {
      const reviews = await prisma.review.findMany({
        include: {
          product: { select: { id: true, name: true, mainImage: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, 'Reviews retrieved', reviews);
    } catch (error) {
      return sendError(res, 'Failed to fetch reviews', 500);
    }
  }

  static async toggleReviewApproval(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const reviewId = parseInt(id, 10);

      const review = await prisma.review.findUnique({ where: { id: reviewId } });
      if (!review) return sendError(res, 'Review not found', 404);

      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: { isApproved: !review.isApproved },
      });

      return sendSuccess(
        res,
        `Review ${updated.isApproved ? 'approved' : 'hidden'}`,
        updated
      );
    } catch (error) {
      return sendError(res, 'Failed to toggle review', 500);
    }
  }

  static async deleteReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.review.delete({ where: { id: parseInt(id, 10) } });
      return sendSuccess(res, 'Review deleted');
    } catch (error) {
      return sendError(res, 'Failed to delete review', 500);
    }
  }

  // ----------------------------------------------------------------------------
  // 11. STORE SETTINGS
  // ----------------------------------------------------------------------------
  static async getSettings(req: Request, res: Response) {
    try {
      const settings = await prisma.siteSetting.findMany();
      const settingsMap: { [key: string]: string } = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      return sendSuccess(res, 'Site settings retrieved', settingsMap);
    } catch (error) {
      return sendError(res, 'Failed to fetch settings', 500);
    }
  }

  static async updateSettings(req: Request, res: Response) {
    try {
      const settings = req.body; // e.g. { STORE_NAME: "BIG BASKET", DELIVERY_FEE: "40", ... }

      for (const [key, value] of Object.entries(settings)) {
        if (typeof value === 'string') {
          await prisma.siteSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          });
        }
      }

      return sendSuccess(res, 'Settings updated successfully');
    } catch (error) {
      return sendError(res, 'Failed to update settings', 500);
    }
  }
}
