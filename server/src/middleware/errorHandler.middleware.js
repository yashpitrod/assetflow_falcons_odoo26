// src/middleware/errorHandler.middleware.js
import { errorResponse } from '../utils/responseFormatter.js';

/**
 * Centralized error catcher that prevents the server from crashing on unhandled exceptions,
 * and ensures the frontend never receives HTML stack traces, only standard JSON.
 */
export const errorHandler = (err, req, res, next) => {
  // Log the stack trace internally so developers can debug
  console.error(`[Unhandled Error] ${err.name}: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Fallback to 500 if the error doesn't already have a status code attached
  const statusCode = err.statusCode || 500;
  
  // Do not expose raw database or code errors to the user in production
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected server error occurred.'
    : err.message || 'An unexpected server error occurred.';

  return errorResponse(res, statusCode, message);
};