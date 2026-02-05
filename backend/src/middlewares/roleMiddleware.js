const { ROLES } = require('../config/constants');
const { sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Restrict access to Admin only
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === ROLES.ADMIN) {
    next();
  } else {
    logger.warn(`Access denied for user ${req.user?.userId} - Admin only route`);
    return sendError(res, 403, 'Access denied. Admin privileges required.');
  }
};

/**
 * Allow both Admin and Manager
 */
const adminOrManager = (req, res, next) => {
  if (req.user && (req.user.role === ROLES.ADMIN || req.user.role === ROLES.MANAGER)) {
    next();
  } else {
    logger.warn(`Access denied for user ${req.user?.userId} - Insufficient permissions`);
    return sendError(res, 403, 'Access denied. Insufficient permissions.');
  }
};

/**
 * Check if user belongs to the business (prevent cross-business access)
 */
const checkBusinessAccess = (businessIdParam = 'businessId') => {
  return (req, res, next) => {
    const requestedBusinessId = req.params[businessIdParam] || req.body.business_id;
    
    if (requestedBusinessId && requestedBusinessId !== req.user.businessId) {
      logger.warn(`Cross-business access attempt by user ${req.user.userId}`);
      return sendError(res, 403, 'Access denied. You can only access your own business data.');
    }
    
    next();
  };
};

module.exports = {
  adminOnly,
  adminOrManager,
  checkBusinessAccess
};