// src/validators/auth.validator.js
import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("A valid email address is required"),
  }),
});