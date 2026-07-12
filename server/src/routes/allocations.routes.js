// src/routes/allocations.routes.js
import { Router } from 'express';
import { createAllocation, returnAllocation, getAllocations } from '../controllers/allocations.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createAllocationSchema } from '../validators/allocations.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

// Get list of allocations
router.get('/', getAllocations);

// Create new allocation — restricted to privileged roles
router.post(
  '/',
  requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD]),
  validate(createAllocationSchema),
  createAllocation
);

// Return an asset — any authenticated user can initiate a return of their own allocation
router.post('/:id/return', returnAllocation);

export default router;