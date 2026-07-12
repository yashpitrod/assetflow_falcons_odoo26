import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notifications.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/read-all', markAllNotificationsRead); // Put before /:id so it doesn't get matched as an ID
router.patch('/:id/read', markNotificationRead);

export default router;
