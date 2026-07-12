// src/routes/transferRequests.routes.js
import { Router } from 'express';
import {
  createTransferRequest, getTransferRequests,
  approveTransferRequest, rejectTransferRequest,
} from '../controllers/transferRequests.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createTransferRequestSchema } from '../validators/allocations.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

// Any authenticated user can list and create transfer requests
router.get('/', getTransferRequests);
router.post('/', validate(createTransferRequestSchema), createTransferRequest);

// Only Asset Manager or Admin can approve/reject — guards the Reallocated workflow step
router.post(
  '/:id/approve',
  requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD]),
  approveTransferRequest
);

router.post(
  '/:id/reject',
  requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD]),
  rejectTransferRequest
);

export default router;