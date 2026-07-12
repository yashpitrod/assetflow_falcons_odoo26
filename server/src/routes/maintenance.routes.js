import { Router } from 'express';
import {
  getMaintenanceRequests,
  createMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  assignTechnician,
  startMaintenanceWork,
  resolveMaintenanceRequest
} from '../controllers/maintenance.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createMaintenanceSchema,
  assignTechnicianSchema,
  resolveMaintenanceSchema
} from '../validators/maintenance.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

router.get('/', getMaintenanceRequests);
router.post('/', validate(createMaintenanceSchema), createMaintenanceRequest);

// Status transitions — restricted to privileged roles
router.post('/:id/approve', requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD]), approveMaintenanceRequest);
router.post('/:id/reject', requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD]), rejectMaintenanceRequest);
router.post('/:id/assign-technician', requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD]), validate(assignTechnicianSchema), assignTechnician);
router.post('/:id/start', requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD]), startMaintenanceWork);
router.post('/:id/resolve', requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD]), validate(resolveMaintenanceSchema), resolveMaintenanceRequest);

export default router;
