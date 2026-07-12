// src/controllers/bookings.controller.js
import prisma from '../prismaClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { isOverlapping } from '../utils/overlapChecker.js';
import { logActivity } from '../utils/activityLogger.js';

export const createBooking = async (req, res, next) => {
  try {
    const { resource_asset_id, start_time, end_time } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id: resource_asset_id } });
    if (!asset || !asset.is_bookable) {
      return errorResponse(res, 400, 'Asset is not available for booking');
    }

    // OVERLAP CHECK
    const existingBookings = await prisma.booking.findMany({
      where: { 
        resource_asset_id,
        status: { in: ['Upcoming', 'Ongoing'] }
      }
    });

    for (let booking of existingBookings) {
      if (isOverlapping(start_time, end_time, booking.start_time, booking.end_time)) {
        return errorResponse(res, 409, `Time slot overlap detected with existing booking from ${booking.start_time.toISOString()} to ${booking.end_time.toISOString()}`);
      }
    }

    const newBooking = await prisma.booking.create({
      data: {
        resource_asset_id,
        booked_by_employee_id: req.user.id,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
      }
    });

    await logActivity(req.user.id, 'CREATED_BOOKING', 'Booking', newBooking.id);
    return successResponse(res, 201, newBooking);
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        resourceAsset: { select: { id: true, assetTag: true, name: true } },
        bookedByEmployee: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    return successResponse(res, 200, bookings);
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!booking) return errorResponse(res, 404, 'Booking not found');

    // Only Upcoming bookings can be cancelled — you cannot cancel what is already happening
    if (booking.status !== 'Upcoming') {
      return errorResponse(res, 409, `Cannot cancel a booking with status: ${booking.status}`);
    }

    // Ensure only the owner or an admin/manager can cancel
    if (booking.bookedByEmployeeId !== req.user.id && !['Admin', 'AssetManager'].includes(req.user.role)) {
      return errorResponse(res, 403, 'You are not authorised to cancel this booking');
    }

    const cancelled = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { status: 'Cancelled' },
    });

    await logActivity(req.user.id, 'CANCELLED_BOOKING', 'Booking', cancelled.id);
    return successResponse(res, 200, cancelled);
  } catch (error) {
    next(error);
  }
};