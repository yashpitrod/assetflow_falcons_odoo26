/**
 * Formats a successful API response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (e.g., 200, 201)
 * @param {any} data - The payload to return
 */
export const successResponse = (res, statusCode, data) => {
  return res.status(statusCode).json({
    success: true,
    data: data,
  });
};

/**
 * Formats an error API response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (e.g., 400, 401, 404, 409, 500)
 * @param {string} message - Human-readable error message
 */
export const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message: message,
  });
};