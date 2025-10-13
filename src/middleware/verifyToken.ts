/**
 * @fileoverview JWT Token verification middleware for Express.js routes.
 * Provides authentication functionality by validating JWT tokens in request headers.
 * @author Tudu Development Team
 * @version 1.0.0
 * @requires jsonwebtoken
 */

import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

// Extend Express Request interface to include 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware function to verify and validate JWT tokens.
 * Extracts token from Authorization header, verifies it, and adds user data to request.
 * Must run BEFORE the request reaches protected route controllers.
 *
 * @function verifyToken
 * @param {Object} req - Express request object
 * @param {Object} req.headers - Request headers object
 * @param {string} req.headers.authorization - Authorization header with Bearer token
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with error message or calls next() if valid
 * @description Validates JWT token and adds decoded user info to req.user
 *
 * @example
 * // Usage in routes:
 * router.get('/protected', verifyToken, protectedController);
 *
 * @example
 * // Expected Authorization header format:
 * headers: {
 *   'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * }
 *
 * @example
 * // After successful verification, req.user contains:
 * req.user = {
 *   id: "userId123",
 *   email: "user@example.com",
 *   iat: 1672531200,
 *   exp: 1672617600
 * }
 */
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    /**
     * Extract Authorization header from request.
     * Should contain "Bearer <token>" format.
     */
    const authHeader = req.headers.authorization;

    /**
     * Check if Authorization header exists.
     * Return 401 if missing.
     */
    if (!authHeader) {
      return res.status(401).json({ message: "Access denied" });
    }

    /**
     * Extract token from "Bearer <token>" format.
     * Split by space and take second part.
     */
    const token = authHeader.split(" ")[1];

    /**
     * Verify token exists after splitting.
     * Return 401 if token is missing.
     */
    if (!token) {
      return res.status(401).json({ message: "Access token is missing" });
    }

    /**
     * Verify and decode JWT token using secret.
     * Throws error if token is invalid or expired.
     */
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    /**
     * Add decoded user information to request object.
     * Makes user data available in subsequent middleware/controllers.
     */
    req.user = decoded;

    /**
     * Continue to next middleware or route handler.
     */
    next();
  } catch (error) {
    /**
     * Handle specific JWT errors with appropriate responses.
     */
    if (error && typeof error === "object" && "name" in error) {
      if ((error as { name: string }).name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token has expired" });
      } else if ((error as { name: string }).name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
    }
    return res.status(500).json({ message: "Inténtalo de nuevo más tarde" });
  }
};

/**
 * Export the verifyToken middleware function.
 * @type {Function}
 * @see verifyToken
 */
export default verifyToken;
