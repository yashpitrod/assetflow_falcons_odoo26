// src/routes/assets.routes.js
import { Router } from 'express';
import {
  createAsset, getAssets, getAssetById, updateAsset, getAssetBookings,
} from '../controllers/assets.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createAssetSchema, updateAssetSchema } from '../validators/assets.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

// Directory view — all authenticated users can browse and view asset details
router.get('/', getAssets);
router.get('/:id', getAssetById);

// Calendar/booking view for a specific bookable asset
router.get('/:id/bookings', getAssetBookings);

// Asset creation and update restricted to Admin and Asset Manager
router.post(
  '/',
  requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER]),
  validate(createAssetSchema),
  createAsset
);

router.put(
  '/:id',
  requireRole([ROLES.ADMIN, ROLES.ASSET_MANAGER]),
  validate(updateAssetSchema),
  updateAsset
);

export default router;