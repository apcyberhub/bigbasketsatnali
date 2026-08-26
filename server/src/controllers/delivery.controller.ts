import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export class DeliveryController {
  static async getDeliverySlots(req: Request, res: Response) {
    try {
      const slots = await prisma.deliverySlot.findMany({
        where: { isActive: true },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });

      // Filter slots that have available capacity
      const formatted = slots.map((slot) => ({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        formattedSlot: `${slot.startTime} - ${slot.endTime} (${slot.date === 'TODAY' ? 'Today' : 'Tomorrow'})`,
        isAvailable: slot.bookedCount < slot.capacity,
        remainingCapacity: slot.capacity - slot.bookedCount,
      }));

      return sendSuccess(res, 'Delivery slots retrieved', formatted);
    } catch (error) {
      return sendError(res, 'Failed to fetch delivery slots', 500);
    }
  }
}
