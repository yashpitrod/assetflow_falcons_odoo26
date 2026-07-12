import prisma from '../prismaClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { AUDIT_STATUS, ASSET_STATUS } from '../utils/constants.js';
import { logActivity } from '../utils/activityLogger.js';

export const getAuditCycles = async (req, res, next) => {
  try {
    const cycles = await prisma.auditCycle.findMany({
      include: {
        department: { select: { id: true, name: true } },
        auditors: {
          include: {
            employee: { select: { id: true, name: true } }
          }
        },
        findings: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = cycles.map(c => {
      const verified = c.findings.filter(f => f.verificationStatus === 'Verified').length;
      const missing = c.findings.filter(f => f.verificationStatus === 'Missing').length;
      const damaged = c.findings.filter(f => f.verificationStatus === 'Damaged').length;
      
      return {
        id: c.id,
        status: c.status,
        scopeDepartmentId: c.scopeDepartmentId,
        departmentName: c.department?.name,
        scopeLocation: c.scopeLocation,
        dateRangeStart: c.dateRangeStart,
        dateRangeEnd: c.dateRangeEnd,
        auditors: c.auditors.map(a => a.employee),
        totalAssets: c.findings.length, // approximation for frontend
        verified,
        missing,
        damaged
      };
    });

    return successResponse(res, 200, 'Audit cycles fetched successfully', formatted);
  } catch (error) {
    next(error);
  }
};

export const createAuditCycle = async (req, res, next) => {
  try {
    const { scopeDepartmentId, scopeLocation, dateRangeStart, dateRangeEnd } = req.body;
    
    const cycle = await prisma.auditCycle.create({
      data: {
        scopeDepartmentId,
        scopeLocation,
        dateRangeStart: new Date(dateRangeStart),
        dateRangeEnd: new Date(dateRangeEnd),
        createdByEmployeeId: req.user.id,
        status: AUDIT_STATUS.OPEN
      }
    });

    await logActivity(req.user.id, 'AUDIT_CYCLE_CREATED', 'AuditCycle', cycle.id);
    return successResponse(res, 201, 'Audit cycle created', cycle);
  } catch (error) {
    next(error);
  }
};

export const addAuditors = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { auditorIds } = req.body;

    const cycle = await prisma.auditCycle.findUnique({ where: { id: parseInt(id) } });
    if (!cycle) return errorResponse(res, 404, 'Audit cycle not found');
    if (cycle.status !== AUDIT_STATUS.OPEN) return errorResponse(res, 400, 'Cannot assign auditors to closed cycle');

    const assignments = auditorIds.map(auditorId => ({
      auditCycleId: parseInt(id),
      employeeId: auditorId
    }));

    await prisma.auditCycleAuditor.createMany({
      data: assignments,
      skipDuplicates: true
    });

    await logActivity(req.user.id, 'AUDITORS_ASSIGNED', 'AuditCycle', cycle.id);
    return successResponse(res, 200, 'Auditors assigned successfully');
  } catch (error) {
    next(error);
  }
};

export const closeAuditCycle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cycle = await prisma.auditCycle.findUnique({ 
      where: { id: parseInt(id) },
      include: { findings: true }
    });
    
    if (!cycle) return errorResponse(res, 404, 'Audit cycle not found');
    if (cycle.status === AUDIT_STATUS.CLOSED) return errorResponse(res, 400, 'Cycle already closed');

    const missingAssets = cycle.findings.filter(f => f.verificationStatus === 'Missing');

    const updated = await prisma.$transaction(async (tx) => {
      const closed = await tx.auditCycle.update({
        where: { id: parseInt(id) },
        data: { status: AUDIT_STATUS.CLOSED }
      });

      // Mark missing assets as Lost
      for (const finding of missingAssets) {
        await tx.asset.update({
          where: { id: finding.assetId },
          data: { status: ASSET_STATUS.LOST }
        });
      }
      return closed;
    });

    await logActivity(req.user.id, 'AUDIT_CYCLE_CLOSED', 'AuditCycle', updated.id);
    return successResponse(res, 200, 'Audit cycle closed successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const createAuditFinding = async (req, res, next) => {
  try {
    const { auditCycleId, assetId, expectedLocation, verificationStatus, notes } = req.body;

    const cycle = await prisma.auditCycle.findUnique({ where: { id: auditCycleId } });
    if (!cycle) return errorResponse(res, 404, 'Audit cycle not found');
    if (cycle.status !== AUDIT_STATUS.OPEN) return errorResponse(res, 400, 'Cannot submit findings for a closed cycle');

    // upsert finding
    const finding = await prisma.auditFinding.upsert({
      where: {
        auditCycleId_assetId: {
          auditCycleId,
          assetId
        }
      },
      update: {
        verificationStatus,
        notes,
        auditedByEmployeeId: req.user.id
      },
      create: {
        auditCycleId,
        assetId,
        expectedLocation,
        verificationStatus,
        notes,
        auditedByEmployeeId: req.user.id
      }
    });

    return successResponse(res, 200, 'Finding recorded successfully', finding);
  } catch (error) {
    next(error);
  }
};
