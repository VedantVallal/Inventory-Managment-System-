const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const { sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Protect routes - Verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return sendError(res, 401, 'Not authorized. Please login.');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, role, business_id, is_active')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        return sendError(res, 401, 'User not found. Please login again.');
      }

      // Check if user is active
      if (!user.is_active) {
        return sendError(res, 403, 'Account is deactivated. Contact admin.');
      }

      // Attach user info to request
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        businessId: user.business_id
      };

      next();

    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Token expired. Please login again.');
      }
      if (err.name === 'JsonWebTokenError') {
        return sendError(res, 401, 'Invalid token. Please login again.');
      }
      throw err;
    }

  } catch (error) {
    logger.error('Auth middleware error:', error);
    return sendError(res, 401, 'Not authorized', error.message);
  }
};

/**
 * Authorize - Check user role
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Not authorized. Please login.');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'Access denied. Insufficient permissions.');
    }

    next();
  };
};

module.exports = { protect, authorize };