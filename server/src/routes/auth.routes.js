// src/routes/auth.routes.js
import { Router } from 'express';
import { signup, login, forgotPassword } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { signupSchema, loginSchema, forgotPasswordSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

export default router;