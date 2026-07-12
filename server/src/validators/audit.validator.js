import { z } from 'zod';
import { VERIFICATION_STATUS } from '../utils/constants.js';

export const createAuditCycleSchema = z.object({
  body: z.object({
    scopeDepartmentId: z.number().int().positive().optional(),
    scopeLocation: z.string().optional(),
    dateRangeStart: z.string(),
    dateRangeEnd: z.string()
  })
});

export const addAuditorsSchema = z.object({
  body: z.object({
    auditorIds: z.array(z.number().int().positive()).min(1, "At least one auditor is required")
  })
});

export const createAuditFindingSchema = z.object({
  body: z.object({
    auditCycleId: z.number().int().positive("Audit cycle ID is required"),
    assetId: z.number().int().positive("Asset ID is required"),
    expectedLocation: z.string().optional(),
    verificationStatus: z.enum([VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.MISSING, VERIFICATION_STATUS.DAMAGED]),
    notes: z.string().nullable().optional()
  })
});
