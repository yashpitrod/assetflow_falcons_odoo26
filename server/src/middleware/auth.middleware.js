// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/responseFormatter.js';

/**
 * Validates the JWT access token to ensure only authenticated users can access the endpoint.
 */
export const authenticate = (req, res, next) => {
  // Extract token from the Authorization header (Expected format: "Bearer <token>")
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Authentication token is missing or invalid format');
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using the secret from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the decoded payload (user ID, role, etc.) to the request object for downstream use
    req.user = decoded;
    next();
  } catch (error) {
    // Distinguish between expired tokens and completely invalid/tampered tokens for better frontend UX
    const message = error.name === 'TokenExpiredError' 
      ? 'Your session has expired. Please log in again.' 
      : 'Invalid authentication token.';
      
    return errorResponse(res, 401, message);
  }
};