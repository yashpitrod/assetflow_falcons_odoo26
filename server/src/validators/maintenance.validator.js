import { z } from 'zod';
import { MAINTENANCE_PRIORITY } from '../utils/constants.js';

export const createMaintenanceSchema = z.object({
  body: z.object({
    assetId: z.number().int().positive("Asset ID is required"),
    issueDescription: z.string().min(10, "Description must be at least 10 characters"),
    priority: z.enum([MAINTENANCE_PRIORITY.LOW, MAINTENANCE_PRIORITY.MEDIUM, MAINTENANCE_PRIORITY.HIGH]).optional()
  })
});

export const assignTechnicianSchema = z.object({
  body: z.object({
    technicianName: z.string().min(2, "Technician name must be at least 2 characters")
  })
});

export const resolveMaintenanceSchema = z.object({
  body: z.object({
    resolutionNotes: z.string().optional()
  })
});
