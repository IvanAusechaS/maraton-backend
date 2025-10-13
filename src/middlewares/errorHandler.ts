import { Request, Response, NextFunction } from 'express';

// Interface para extender Error con campos opcionales
interface AppError extends Error {
  statusCode?: number;
  status?: number;
}

/**
 * Global error handling middleware
 *
 * Handles all unhandled errors in the application, logging useful details in 
 * development mode and restricting output in production. Differentiates between 
 * server-side (5xx) and client-side (4xx) errors to send appropriate responses.
 *
 * @param {AppError} err - The error object caught by Express
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
const globalErrorHandler = (
  err: AppError | any,
  req: Request,
  res: Response
): void => {
  // Log error details only in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled error:', err);
    console.error('Stack trace:', err.stack);
    console.error('Request URL:', req.originalUrl);
    console.error('Request method:', req.method);
    console.error('Request body:', req.body);
  } else {
    // In production, log only essential info
    console.error('Unhandled error occurred on:', req.originalUrl);
  }

  // Determine error status
  const statusCode = err.statusCode || err.status || 500;
  
  // Send appropriate response
  if (statusCode >= 500) {
    // Server errors (5xx)
    res.status(statusCode).json({
      success: false,
      message: 'Try again later',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  } else {
    // Client errors (4xx) - pass through the original message
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Bad request',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  }
};

/**
 * 404 handler for unmatched routes
 */
const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/usuarios/',
      'POST /api/usuarios/:id'
    ]
  });
};

export {
  globalErrorHandler,
  notFoundHandler
};