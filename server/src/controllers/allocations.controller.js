// src/controllers/allocations.controller.js
import prisma from '../prismaClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { ASSET_STATUS } from '../utils/constants.js';
import { logActivity } from '../utils/activityLogger.js';

export const createAllocation = async (req, res, next) => {
  try {
    const { asset_id, employee_id, expected_return_date } = req.body;

    const asset = await prisma.asset.findUnique({ 
      where: { id: asset_id },
      include: { allocations: { where: { status: 'Active' }, include: { employee: true } } }
    });

    if (!asset) return errorResponse(res, 404, 'Asset not found');

    // CONFLICT CHECK
    // Use || so EITHER a non-Available status OR existing active allocations triggers the conflict block
    if (asset.status !== ASSET_STATUS.AVAILABLE || asset.allocations.length > 0) {
      const currentHolder = asset.allocations[0].employee?.name || 'a department';
      return errorResponse(res, 409, `Conflict: This asset is currently held by ${currentHolder}. Please request a transfer instead.`);
    }

    // Process Allocation
    const allocation = await prisma.$transaction(async (tx) => {
      const newAlloc = await tx.allocation.create({
        data: {
          asset_id,
          employee_id,
          expected_return_date: expected_return_date ? new Date(expected_return_date) : null
        }
      });

      await tx.asset.update({
        where: { id: asset_id },
        data: { status: ASSET_STATUS.ALLOCATED }
      });

      return newAlloc;
    });

    await logActivity(req.user.id, 'ALLOCATED_ASSET', 'Allocation', allocation.id);
    return successResponse(res, 201, allocation);
  } catch (error) {
    next(error);
  }
};

export const returnAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { condition_notes_on_return } = req.body;

    const allocation = await prisma.allocation.findUnique({
      where: { id: parseInt(id) },
      include: { asset: true },
    });

    if (!allocation) return errorResponse(res, 404, 'Allocation not found');
    if (allocation.status !== 'Active') {
      return errorResponse(res, 409, 'This asset has already been returned');
    }

    // Close the allocation and free the asset in one atomic transaction
    const updated = await prisma.$transaction(async (tx) => {
      const closedAlloc = await tx.allocation.update({
        where: { id: parseInt(id) },
        data: {
          status: 'Returned',
          actualReturnDate: new Date(),
          conditionNotesOnReturn: condition_notes_on_return || null,
        },
      });

      await tx.asset.update({
        where: { id: allocation.assetId },
        data: { status: ASSET_STATUS.AVAILABLE },
      });

      return closedAlloc;
    });

    await logActivity(req.user.id, 'RETURNED_ASSET', 'Allocation', updated.id);
    return successResponse(res, 200, updated);
  } catch (error) {
    next(error);
  }
};