// src/routes/org.routes.js
import { Router } from 'express';
import {
  createDepartment, getDepartments, updateDepartment,
  createCategory, getCategories, updateCategory,
  getEmployees, promoteEmployee,
} from '../controllers/org.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createDepartmentSchema, updateDepartmentSchema,
  createCategorySchema, updateCategorySchema,
  promoteEmployeeSchema,
} from '../validators/org.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// All org routes require authentication
router.use(authenticate);
router.use(requireRole([ROLES.ADMIN]));

// Department routes
router.get('/departments', getDepartments);
router.post('/departments', validate(createDepartmentSchema), createDepartment);
router.put('/departments/:id', validate(updateDepartmentSchema), updateDepartment);

// Category routes
router.get('/categories', getCategories);
router.post('/categories', validate(createCategorySchema), createCategory);
router.put('/categories/:id', validate(updateCategorySchema), updateCategory);

// Employee directory — Admin reads all; promote is a separate escalation action
router.get('/employees', getEmployees);
router.patch('/employees/:id/promote', validate(promoteEmployeeSchema), promoteEmployee);

export default router;