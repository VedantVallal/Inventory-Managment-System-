/**
 * Send success response
 */
const sendSuccess = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send error response
 */
const sendError = (res, statusCode, message, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error || undefined
  });
};

/**
 * Generate unique SKU
 */
const generateSKU = (productName, businessId) => {
  const prefix = productName.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Calculate percentage
 */
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(2);
};

/**
 * Paginate results
 */
const paginate = (data, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  return {
    currentPage: page,
    totalPages: Math.ceil(data.length / limit),
    totalItems: data.length,
    itemsPerPage: limit,
    data: data.slice(startIndex, endIndex)
  };
};

module.exports = {
  sendSuccess,
  sendError,
  generateSKU,
  formatCurrency,
  calculatePercentage,
  paginate
};