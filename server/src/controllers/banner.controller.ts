import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export class BannerController {
  static async getActiveBanners(req: Request, res: Response) {
    try {
      const banners = await prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      return sendSuccess(res, 'Active promotional banners retrieved', banners);
    } catch (error) {
      return sendError(res, 'Failed to fetch banners', 500);
    }
  }
}
