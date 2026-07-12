import { errorResponse } from '../utils/responseFormatter.js';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      next();
    } catch (error) {
      if (error.errors && Array.isArray(error.errors)) {
        const specificErrorMessage = error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');

        return errorResponse(res, 400, specificErrorMessage);
      }

      return errorResponse(res, 500, 'An unexpected validation error occurred.');
    }
  };
};