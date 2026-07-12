import prisma from '../prismaClient.js';
import { successResponse } from '../utils/responseFormatter.js';
import { ASSET_STATUS } from '../utils/constants.js';

export const getUtilizationReport = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        assets: {
          select: { status: true }
        }
      }
    });

    const data = departments.map(d => {
      const total = d.assets.length;
      const allocated = d.assets.filter(a => a.status === ASSET_STATUS.ALLOCATED).length;
      return {
        departmentName: d.name,
        utilizationPercent: total > 0 ? Math.round((allocated / total) * 100) : 0
      };
    });

    return successResponse(res, 200, 'Utilization report generated', data);
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceFrequency = async (req, res, next) => {
  try {
    // Generate an array of the last 6 months in format "MMM"
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('default', { month: 'short' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      });
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        createdAt: {
          gte: months[0].start
        }
      }
    });

    const data = months.map(m => {
      const count = requests.filter(r => r.createdAt >= m.start && r.createdAt <= m.end).length;
      return {
        month: m.label,
        requests: count
      };
    });

    return successResponse(res, 200, 'Maintenance frequency report generated', data);
  } catch (error) {
    next(error);
  }
};

export const getIdleAssets = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Assets that are Available and haven't had an allocation returned in the last 30 days
    // Simplified: Find available assets, get their most recent allocation's return date
    const assets = await prisma.asset.findMany({
      where: {
        status: ASSET_STATUS.AVAILABLE
      },
      include: {
        allocations: {
          orderBy: { actualReturnDate: 'desc' },
          take: 1
        }
      }
    });

    const idle = [];
    const now = new Date();

    for (const asset of assets) {
      let daysIdle = 0;
      if (asset.allocations.length === 0) {
        // Never allocated, use creation date
        daysIdle = Math.floor((now - asset.createdAt) / (1000 * 60 * 60 * 24));
      } else {
        const lastAlloc = asset.allocations[0];
        if (lastAlloc.actualReturnDate) {
          daysIdle = Math.floor((now - lastAlloc.actualReturnDate) / (1000 * 60 * 60 * 24));
        }
      }

      if (daysIdle >= 30) {
        idle.push({
          id: asset.id,
          name: asset.name,
          assetTag: asset.assetTag,
          daysIdle
        });
      }
    }

    // Sort by daysIdle descending
    idle.sort((a, b) => b.daysIdle - a.daysIdle);

    return successResponse(res, 200, 'Idle assets fetched', idle);
  } catch (error) {
    next(error);
  }
};

export const getMostUsedAssets = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.groupBy({
      by: ['assetId'],
      _count: {
        assetId: true
      },
      orderBy: {
        _count: {
          assetId: 'desc'
        }
      },
      take: 10
    });

    // Fetch the asset details for the top booked assets
    const topAssets = [];
    for (const b of bookings) {
      const asset = await prisma.asset.findUnique({
        where: { id: b.assetId },
        select: { id: true, name: true, assetTag: true }
      });
      if (asset) {
        topAssets.push({
          assetId: asset.id,
          name: asset.name,
          assetTag: asset.assetTag,
          bookingCount: b._count.assetId
        });
      }
    }

    return successResponse(res, 200, 'Most used assets fetched', topAssets);
  } catch (error) {
    next(error);
  }
};
