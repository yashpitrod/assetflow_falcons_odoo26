import { Router } from 'express';
import {
  getUtilizationReport,
  getMaintenanceFrequency,
  getIdleAssets,
  getMostUsedAssets
} from '../controllers/reports.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);
router.use(requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER]));

router.get('/utilization', getUtilizationReport);
router.get('/maintenance-frequency', getMaintenanceFrequency);
router.get('/idle-assets', getIdleAssets);
router.get('/most-used-assets', getMostUsedAssets);

export default router;
