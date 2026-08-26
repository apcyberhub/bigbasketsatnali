import { Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class AddressController {
  static async getAddresses(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const addresses = await prisma.address.findMany({
        where: { userId: req.user.id },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });

      return sendSuccess(res, 'Addresses retrieved', addresses);
    } catch (error) {
      return sendError(res, 'Failed to fetch addresses', 500);
    }
  }

  static async createAddress(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const {
        fullName,
        phone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        postalCode,
        addressType,
        isDefault = false,
      } = req.body;

      // If set to default or first address, unset previous defaults
      const count = await prisma.address.count({ where: { userId: req.user.id } });
      const makeDefault = isDefault || count === 0;

      if (makeDefault) {
        await prisma.address.updateMany({
          where: { userId: req.user.id },
          data: { isDefault: false },
        });
      }

      const address = await prisma.address.create({
        data: {
          userId: req.user.id,
          fullName: fullName.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2 ? addressLine2.trim() : null,
          landmark: landmark ? landmark.trim() : null,
          city: city ? city.trim() : 'Indore',
          state: state ? state.trim() : 'Madhya Pradesh',
          postalCode: postalCode.trim(),
          addressType: addressType || 'HOME',
          isDefault: makeDefault,
        },
      });

      return sendSuccess(res, 'Address added successfully', address, 201);
    } catch (error) {
      console.error('createAddress error:', error);
      return sendError(res, 'Failed to create address', 500);
    }
  }

  static async updateAddress(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { id } = req.params;
      const addressId = parseInt(id, 10);

      const existing = await prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!existing || existing.userId !== req.user.id) {
        return sendError(res, 'Address not found or permission denied', 404);
      }

      const {
        fullName,
        phone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        postalCode,
        addressType,
        isDefault,
      } = req.body;

      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId: req.user.id },
          data: { isDefault: false },
        });
      }

      const updated = await prisma.address.update({
        where: { id: addressId },
        data: {
          fullName: fullName !== undefined ? fullName.trim() : undefined,
          phone: phone !== undefined ? phone.trim() : undefined,
          addressLine1: addressLine1 !== undefined ? addressLine1.trim() : undefined,
          addressLine2: addressLine2 !== undefined ? addressLine2.trim() : undefined,
          landmark: landmark !== undefined ? landmark.trim() : undefined,
          city: city !== undefined ? city.trim() : undefined,
          state: state !== undefined ? state.trim() : undefined,
          postalCode: postalCode !== undefined ? postalCode.trim() : undefined,
          addressType: addressType || undefined,
          isDefault: isDefault !== undefined ? isDefault : undefined,
        },
      });

      return sendSuccess(res, 'Address updated successfully', updated);
    } catch (error) {
      return sendError(res, 'Failed to update address', 500);
    }
  }

  static async deleteAddress(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { id } = req.params;
      const addressId = parseInt(id, 10);

      const existing = await prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!existing || existing.userId !== req.user.id) {
        return sendError(res, 'Address not found', 404);
      }

      await prisma.address.delete({
        where: { id: addressId },
      });

      // If default was deleted, make the first remaining address default
      if (existing.isDefault) {
        const remaining = await prisma.address.findFirst({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
        });
        if (remaining) {
          await prisma.address.update({
            where: { id: remaining.id },
            data: { isDefault: true },
          });
        }
      }

      return sendSuccess(res, 'Address deleted successfully');
    } catch (error) {
      return sendError(res, 'Failed to delete address', 500);
    }
  }

  static async setDefaultAddress(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { id } = req.params;
      const addressId = parseInt(id, 10);

      const existing = await prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!existing || existing.userId !== req.user.id) {
        return sendError(res, 'Address not found', 404);
      }

      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });

      const updated = await prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });

      return sendSuccess(res, 'Default address set successfully', updated);
    } catch (error) {
      return sendError(res, 'Failed to set default address', 500);
    }
  }
}
