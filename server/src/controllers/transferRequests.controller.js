// src/controllers/transferRequests.controller.js
import prisma from '../prismaClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { logActivity } from '../utils/activityLogger.js';
import { ASSET_STATUS } from '../utils/constants.js';

export const createTransferRequest = async (req, res, next) => {
  try {
    const { asset_id, to_employee_id, reason } = req.body;
    
    // Assume from_employee_id is the currently authenticated user
    const request = await prisma.transferRequest.create({
      data: {
        asset_id,
        from_employee_id: req.user.id,
        to_employee_id,
        reason,
        requested_by: req.user.id,
      }
    });

    await logActivity(req.user.id, 'INITIATED_TRANSFER', 'TransferRequest', request.id);
    return successResponse(res, 201, request);
  } catch (error) {
    next(error);
  }
};

export const getTransferRequests = async (req, res, next) => {
  try {
    const requests = await prisma.transferRequest.findMany({
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        fromEmployee: { select: { id: true, name: true } },
        toEmployee: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 200, requests);
  } catch (error) {
    next(error);
  }
};

export const approveTransferRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transferRequest = await prisma.transferRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        // Need the current active allocation to close it
        asset: { include: { allocations: { where: { status: 'Active' } } } },
      },
    });

    if (!transferRequest) return errorResponse(res, 404, 'Transfer request not found');
    if (transferRequest.status !== 'Requested') {
      return errorResponse(res, 409, `Transfer request is already ${transferRequest.status}`);
    }

    // Execute the full transfer workflow atomically: close old alloc → open new alloc → update request
    const result = await prisma.$transaction(async (tx) => {
      // 1. Close the existing active allocation if one exists
      if (transferRequest.asset.allocations.length > 0) {
        await tx.allocation.update({
          where: { id: transferRequest.asset.allocations[0].id },
          data: { status: 'Returned', actualReturnDate: new Date() },
        });
      }

      // 2. Open a new allocation for the recipient employee
      await tx.allocation.create({
        data: {
          assetId: transferRequest.assetId,
          employeeId: transferRequest.toEmployeeId,
          status: 'Active',
        },
      });

      // 3. Mark the transfer as Reallocated and record who approved it
      const approved = await tx.transferRequest.update({
        where: { id: parseInt(id) },
        data: { status: 'Reallocated', approvedBy: req.user.id },
      });

      return approved;
    });

    await logActivity(req.user.id, 'APPROVED_TRANSFER', 'TransferRequest', result.id);
    return successResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

export const rejectTransferRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transferRequest = await prisma.transferRequest.findUnique({
      where: { id: parseInt(id) },
    });

    if (!transferRequest) return errorResponse(res, 404, 'Transfer request not found');
    if (transferRequest.status !== 'Requested') {
      return errorResponse(res, 409, `Transfer request is already ${transferRequest.status}`);
    }

    const rejected = await prisma.transferRequest.update({
      where: { id: parseInt(id) },
      // Record who rejected and stamp the status
      data: { status: 'Rejected', approvedBy: req.user.id },
    });

    await logActivity(req.user.id, 'REJECTED_TRANSFER', 'TransferRequest', rejected.id);
    return successResponse(res, 200, rejected);
  } catch (error) {
    next(error);
  }
};