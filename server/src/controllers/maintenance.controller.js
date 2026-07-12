import prisma from '../prismaClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { MAINTENANCE_STATUS, ASSET_STATUS, MAINTENANCE_PRIORITY } from '../utils/constants.js';
import { logActivity } from '../utils/activityLogger.js';

export const getMaintenanceRequests = async (req, res, next) => {
  try {
    const requests = await prisma.maintenanceRequest.findMany({
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        raisedByEmployee: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return successResponse(res, 200, 'Maintenance requests fetched successfully', requests);
  } catch (error) {
    next(error);
  }
};

export const createMaintenanceRequest = async (req, res, next) => {
  try {
    const { assetId, issueDescription, priority } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return errorResponse(res, 404, 'Asset not found');

    const request = await prisma.maintenanceRequest.create({
      data: {
        assetId,
        raisedByEmployeeId: req.user.id,
        issueDescription,
        priority: priority || MAINTENANCE_PRIORITY.MEDIUM,
        status: MAINTENANCE_STATUS.PENDING
      },
      include: {
        asset: { select: { name: true } }
      }
    });

    await logActivity(req.user.id, 'MAINTENANCE_REQUESTED', 'MaintenanceRequest', request.id, { asset: request.asset.name });
    return successResponse(res, 201, 'Maintenance request created successfully', request);
  } catch (error) {
    next(error);
  }
};

export const approveMaintenanceRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await prisma.maintenanceRequest.findUnique({ where: { id: parseInt(id) }, include: { asset: true } });
    
    if (!request) return errorResponse(res, 404, 'Maintenance request not found');
    if (request.status !== MAINTENANCE_STATUS.PENDING) return errorResponse(res, 400, `Cannot approve request with status ${request.status}`);

    const updated = await prisma.$transaction(async (tx) => {
      const updReq = await tx.maintenanceRequest.update({
        where: { id: parseInt(id) },
        data: {
          status: MAINTENANCE_STATUS.APPROVED,
          approvedByEmployeeId: req.user.id
        }
      });
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: ASSET_STATUS.UNDER_MAINTENANCE }
      });
      return updReq;
    });

    await logActivity(req.user.id, 'MAINTENANCE_APPROVED', 'MaintenanceRequest', updated.id, { asset: request.asset.name });
    return successResponse(res, 200, 'Maintenance request approved', updated);
  } catch (error) {
    next(error);
  }
};

export const rejectMaintenanceRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await prisma.maintenanceRequest.findUnique({ where: { id: parseInt(id) }, include: { asset: true } });
    
    if (!request) return errorResponse(res, 404, 'Maintenance request not found');
    if (request.status !== MAINTENANCE_STATUS.PENDING) return errorResponse(res, 400, `Cannot reject request with status ${request.status}`);

    const updated = await prisma.maintenanceRequest.update({
      where: { id: parseInt(id) },
      data: { status: MAINTENANCE_STATUS.REJECTED }
    });

    await logActivity(req.user.id, 'MAINTENANCE_REJECTED', 'MaintenanceRequest', updated.id, { asset: request.asset.name });
    return successResponse(res, 200, 'Maintenance request rejected', updated);
  } catch (error) {
    next(error);
  }
};

export const assignTechnician = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { technicianName } = req.body;
    
    const request = await prisma.maintenanceRequest.findUnique({ where: { id: parseInt(id) }, include: { asset: true } });
    if (!request) return errorResponse(res, 404, 'Maintenance request not found');
    if (request.status !== MAINTENANCE_STATUS.APPROVED) return errorResponse(res, 400, `Cannot assign technician for request with status ${request.status}`);

    const updated = await prisma.maintenanceRequest.update({
      where: { id: parseInt(id) },
      data: {
        technicianName,
        status: MAINTENANCE_STATUS.TECHNICIAN_ASSIGNED
      }
    });

    await logActivity(req.user.id, 'TECHNICIAN_ASSIGNED', 'MaintenanceRequest', updated.id, { technician: technicianName });
    return successResponse(res, 200, 'Technician assigned successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const startMaintenanceWork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await prisma.maintenanceRequest.findUnique({ where: { id: parseInt(id) }, include: { asset: true } });
    
    if (!request) return errorResponse(res, 404, 'Maintenance request not found');
    if (request.status !== MAINTENANCE_STATUS.TECHNICIAN_ASSIGNED) return errorResponse(res, 400, `Cannot start work for request with status ${request.status}`);

    const updated = await prisma.maintenanceRequest.update({
      where: { id: parseInt(id) },
      data: { status: MAINTENANCE_STATUS.IN_PROGRESS }
    });

    await logActivity(req.user.id, 'MAINTENANCE_STARTED', 'MaintenanceRequest', updated.id, { asset: request.asset.name });
    return successResponse(res, 200, 'Maintenance work started', updated);
  } catch (error) {
    next(error);
  }
};

export const resolveMaintenanceRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;
    
    const request = await prisma.maintenanceRequest.findUnique({ where: { id: parseInt(id) }, include: { asset: true } });
    if (!request) return errorResponse(res, 404, 'Maintenance request not found');
    if (request.status !== MAINTENANCE_STATUS.IN_PROGRESS) return errorResponse(res, 400, `Cannot resolve request with status ${request.status}`);

    const updated = await prisma.$transaction(async (tx) => {
      const updReq = await tx.maintenanceRequest.update({
        where: { id: parseInt(id) },
        data: {
          status: MAINTENANCE_STATUS.RESOLVED,
          resolutionNotes,
          completionDate: new Date()
        }
      });
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: ASSET_STATUS.AVAILABLE }
      });
      return updReq;
    });

    await logActivity(req.user.id, 'MAINTENANCE_RESOLVED', 'MaintenanceRequest', updated.id, { asset: request.asset.name });
    return successResponse(res, 200, 'Maintenance request resolved', updated);
  } catch (error) {
    next(error);
  }
};
