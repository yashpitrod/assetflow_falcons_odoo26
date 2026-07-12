import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityLogs.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getActivityLogs);

export default router;
