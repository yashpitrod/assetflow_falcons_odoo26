import { PrismaClient } from '@prisma/client';
import { successResponse } from '../utils/responseFormatter.js';

const prisma = new PrismaClient();

export const getKPIs = async (req, res, next) => {
  try {
    const [totalAssets, available, allocated, activeBookings, pendingTransfers, inMaintenance] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'Available' } }),
      prisma.asset.count({ where: { status: 'Allocated' } }),
      prisma.booking.count({ where: { status: 'Ongoing' } }),
      prisma.transferRequest.count({ where: { status: 'Requested' } }),
      prisma.asset.count({ where: { status: 'UnderMaintenance' } })
    ]);

    return successResponse(res, 200, {
      totalAssets,
      available,
      allocated,
      activeBookings,
      pendingTransfers,
      inMaintenance
    });
  } catch (error) {
    next(error);
  }
};

export const getOverdueReturns = async (req, res, next) => {
  try {
    const overdue = await prisma.allocation.findMany({
      where: {
        status: 'Active',
        expectedReturnDate: { lt: new Date() }
      },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        employee: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } }
      }
    });

    const formatted = overdue.map(alloc => {
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysOverdue = Math.floor((new Date() - alloc.expectedReturnDate) / msPerDay);
      return {
        ...alloc,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0
      };
    });

    return successResponse(res, 200, formatted);
  } catch (error) {
    next(error);
  }
};
