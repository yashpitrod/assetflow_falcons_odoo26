import { Router } from 'express';
import {
  getAuditCycles,
  createAuditCycle,
  addAuditors,
  closeAuditCycle,
  createAuditFinding
} from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createAuditCycleSchema,
  addAuditorsSchema,
  createAuditFindingSchema
} from '../validators/audit.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

// Cycles
router.get('/audit-cycles', getAuditCycles);
router.post('/audit-cycles', requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER]), validate(createAuditCycleSchema), createAuditCycle);
router.post('/audit-cycles/:id/auditors', requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER]), validate(addAuditorsSchema), addAuditors);
router.post('/audit-cycles/:id/close', requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER]), closeAuditCycle);

// Findings
router.post('/audit-findings', validate(createAuditFindingSchema), createAuditFinding);

export default router;
