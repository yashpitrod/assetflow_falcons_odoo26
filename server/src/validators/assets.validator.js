// src/validators/assets.validator.js
import { z } from 'zod';

export const createAssetSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Asset name is required"),
    
    // Changed from string UUID to a standard number
    categoryId: z.number().int().positive("Invalid Category ID"),
    
    serialNumber: z.string().optional(),
    acquisitionDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid acquisition date format",
    }),
    acquisitionCost: z.number().nonnegative("Cost cannot be negative"),
    condition: z.string().min(1, "Condition is required"),
    location: z.string().min(1, "Location is required"),
    isBookable: z.boolean().default(false),
    
    // Changed this to number as well for future-proofing
    departmentId: z.number().int().positive("Invalid Department ID").optional(),
  }),
});

// All fields optional for partial updates — only provided fields are changed
export const updateAssetSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Asset name must be at least 2 characters").optional(),
    categoryId: z.number().int().positive("Invalid Category ID").optional(),
    serialNumber: z.string().optional(),
    acquisitionDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid acquisition date format",
    }).optional(),
    acquisitionCost: z.number().nonnegative("Cost cannot be negative").optional(),
    condition: z.string().min(1, "Condition is required").optional(),
    location: z.string().min(1, "Location is required").optional(),
    isBookable: z.boolean().optional(),
    status: z.string().optional(),
    departmentId: z.number().int().positive("Invalid Department ID").optional(),
  }),
});