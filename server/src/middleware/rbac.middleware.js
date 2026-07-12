// src/middleware/rbac.middleware.js
import { errorResponse } from '../utils/responseFormatter.js';

/**
 * Factory function that returns a middleware to check if the authenticated user has a permitted role.
 * @param {string[]} allowedRoles - Array of roles allowed to access the route (e.g., ['Admin', 'AssetManager'])
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Failsafe: Ensure authenticate middleware ran first
    if (!req.user || !req.user.role) {
      return errorResponse(res, 401, 'User identity not found. Ensure authentication middleware is applied first.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};