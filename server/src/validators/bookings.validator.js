// src/validators/bookings.validator.js
import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    resource_asset_id: z.string().uuid("Invalid Asset ID format"),
    start_time: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid start time format",
    }),
    end_time: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid end time format",
    }),
  }).refine((data) => new Date(data.start_time) < new Date(data.end_time), {
    message: "End time must be strictly after start time",
    path: ["end_time"],
  }),
});