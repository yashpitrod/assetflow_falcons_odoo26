import prisma from '../prismaClient.js';
import { successResponse } from '../utils/responseFormatter.js';

export const getActivityLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: { select: { name: true } }
        }
      }),
      prisma.activityLog.count()
    ]);

    const formatted = logs.map(l => ({
      ...l,
      actorName: l.employee?.name || 'System'
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
