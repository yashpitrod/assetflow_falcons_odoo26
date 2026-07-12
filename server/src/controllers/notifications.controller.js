import prisma from '../prismaClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { NOTIFICATION_TYPE } from '../utils/constants.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { filter = 'all' } = req.query;

    let typeFilter = {};
    if (filter === 'alerts') {
      typeFilter = {
        in: [NOTIFICATION_TYPE.OVERDUE_RETURN, NOTIFICATION_TYPE.AUDIT_DISCREPANCY]
      };
    } else if (filter === 'approvals') {
      typeFilter = {
        in: [NOTIFICATION_TYPE.MAINTENANCE_APPROVED, NOTIFICATION_TYPE.MAINTENANCE_REJECTED, NOTIFICATION_TYPE.TRANSFER_APPROVED]
      };
    } else if (filter === 'bookings') {
      typeFilter = {
        in: [NOTIFICATION_TYPE.BOOKING_CONFIRMED, NOTIFICATION_TYPE.BOOKING_CANCELLED, NOTIFICATION_TYPE.BOOKING_REMINDER]
      };
    }

    const whereClause = {
      employeeId: req.user.id
    };
    if (Object.keys(typeFilter).length > 0) {
      whereClause.type = typeFilter;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, 200, 'Notifications fetched', notifications);
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.findUnique({ where: { id: parseInt(id) } });
    if (!notification) return errorResponse(res, 404, 'Notification not found');
    if (notification.employeeId !== req.user.id) return errorResponse(res, 403, 'Unauthorized access to this notification');

    const updated = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });

    return successResponse(res, 200, 'Notification marked as read', updated);
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        employeeId: req.user.id,
        isRead: false
      },
      data: { isRead: true }
    });

    return successResponse(res, 200, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};
