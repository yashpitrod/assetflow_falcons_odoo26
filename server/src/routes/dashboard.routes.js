import { Router } from 'express';
import { getKPIs, getOverdueReturns } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/kpis', getKPIs);
router.get('/overdue-returns', getOverdueReturns);

export default router;
