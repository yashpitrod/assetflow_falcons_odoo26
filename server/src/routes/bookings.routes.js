// src/routes/bookings.routes.js
import { Router } from 'express';
import { createBooking, getBookings, cancelBooking } from '../controllers/bookings.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createBookingSchema } from '../validators/bookings.validator.js';

const router = Router();

router.use(authenticate);

// Any authenticated user can view and create bookings
router.get('/', getBookings);
router.post('/', validate(createBookingSchema), createBooking);

// Cancel — ownership + role check is handled inside the controller
router.post('/:id/cancel', cancelBooking);

export default router;