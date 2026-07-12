// src/validators/org.validator.js
import { z } from 'zod';
import { ROLES } from '../utils/constants.js';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Department name is required"),
    code: z.string().min(2, "Department code is required"),
    head_id: z.string().uuid("Invalid Employee ID format").optional(),
    parent_department_id: z.string().uuid("Invalid Department ID format").optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Department name must be at least 2 characters").optional(),
    code: z.string().min(2, "Department code must be at least 2 characters").optional(),
    headId: z.number().int().positive("Invalid Employee ID").nullable().optional(),
    parentDepartmentId: z.number().int().positive("Invalid Department ID").nullable().optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Category name is required"),
    warranty_period: z.number().int().nonnegative().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Category name must be at least 2 characters").optional(),
    warrantyPeriod: z.number().int().nonnegative("Warranty period cannot be negative").nullable().optional(),
  }),
});

export const promoteEmployeeSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Invalid Employee ID format"),
  }),
  body: z.object({
    role: z.enum([ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD], {
      errorMap: () => ({ message: "Invalid role specified for promotion" })
    }),
  }),
});