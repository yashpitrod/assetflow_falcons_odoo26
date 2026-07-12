// src/validators/allocations.validator.js
import { z } from 'zod';

export const createAllocationSchema = z.object({
  body: z.object({
    asset_id: z.string().uuid("Invalid Asset ID format"),
    employee_id: z.string().uuid("Invalid Employee ID format").optional(),
    department_id: z.string().uuid("Invalid Department ID format").optional(),
    expected_return_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid expected return date format",
    }).optional(),
  }).refine((data) => data.employee_id || data.department_id, {
    message: "Allocation must be assigned to either an employee or a department",
    path: ["employee_id"],
  }),
});

export const createTransferRequestSchema = z.object({
  body: z.object({
    asset_id: z.string().uuid("Invalid Asset ID format"),
    to_employee_id: z.string().uuid("Invalid Employee ID format"),
    reason: z.string().min(5, "A reason for transfer must be provided (min 5 characters)"),
  }),
});