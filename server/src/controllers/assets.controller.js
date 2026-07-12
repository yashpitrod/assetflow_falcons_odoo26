import prisma from '../prismaClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { generateAssetTag } from '../utils/assetTagGenerator.js';
import { logActivity } from '../utils/activityLogger.js';
import { ASSET_STATUS } from '../utils/constants.js';

export const createAsset = async (req, res, next) => {
  try {
    const lastAsset = await prisma.asset.findFirst({
      orderBy: { assetTag: 'desc' },
    });

    const newTag = generateAssetTag(lastAsset?.assetTag || null);
    
    const assetData = { 
      ...req.body, 
      assetTag: newTag,
      acquisitionDate: new Date(req.body.acquisitionDate) 
    };

    const asset = await prisma.asset.create({ data: assetData });
    
    await logActivity(req.user?.id, 'CREATED_ASSET', 'Asset', asset.id);

    return successResponse(res, 201, asset);
  } catch (error) {
    next(error);
  }
};

export const getAssets = async (req, res, next) => {
  try {
    const assets = await prisma.asset.findMany({ 
      include: { category: true, department: true } 
    });
    return successResponse(res, 200, assets);
  } catch (error) {
    next(error);
  }
};

export const getAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        department: true,
        // Full allocation history with employee detail for the detail panel
        allocations: {
          include: { employee: { select: { id: true, name: true, email: true } } },
          orderBy: { allocatedDate: 'desc' },
        },
        maintenanceRequests: {
          include: { raisedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!asset) return errorResponse(res, 404, 'Asset not found');
    return successResponse(res, 200, asset);
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Prevent accidental overwrite of auto-generated fields
    const { assetTag, ...updateData } = req.body;
    if (updateData.acquisitionDate) {
      updateData.acquisitionDate = new Date(updateData.acquisitionDate);
    }
    const asset = await prisma.asset.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    await logActivity(req.user.id, 'UPDATED_ASSET', 'Asset', asset.id);
    return successResponse(res, 200, asset);
  } catch (error) {
    if (error.code === 'P2025') return errorResponse(res, 404, 'Asset not found');
    next(error);
  }
};

export const getAssetBookings = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Return upcoming + ongoing bookings for the calendar slot picker on the booking screen
    const bookings = await prisma.booking.findMany({
      where: {
        resourceAssetId: parseInt(id),
        status: { in: ['Upcoming', 'Ongoing'] },
      },
      include: { bookedByEmployee: { select: { id: true, name: true } } },
      orderBy: { startTime: 'asc' },
    });
    return successResponse(res, 200, bookings);
  } catch (error) {
    next(error);
  }
};