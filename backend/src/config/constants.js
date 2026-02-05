module.exports = {
  // User roles
  ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager'
  },

  // Payment methods
  PAYMENT_METHODS: {
    CASH: 'cash',
    CARD: 'card',
    UPI: 'upi',
    NETBANKING: 'netbanking',
    CHEQUE: 'cheque',
    OTHER: 'other'
  },

  // Payment status
  PAYMENT_STATUS: {
    PAID: 'paid',
    PENDING: 'pending',
    PARTIAL: 'partial'
  },

  // Alert types
  ALERT_TYPES: {
    LOW_STOCK: 'low_stock',
    OUT_OF_STOCK: 'out_of_stock',
    OVERSTOCK: 'overstock',
    EXPIRY_WARNING: 'expiry_warning'
  },

  // Stock adjustment reasons
  ADJUSTMENT_REASONS: {
    DAMAGED: 'damaged',
    EXPIRED: 'expired',
    THEFT: 'theft',
    LOST: 'lost',
    FOUND: 'found',
    CORRECTION: 'correction',
    RETURN: 'return',
    OTHER: 'other'
  },

  // Adjustment types
  ADJUSTMENT_TYPES: {
    INCREASE: 'increase',
    DECREASE: 'decrease'
  },

  // Default values
  DEFAULTS: {
    LOW_STOCK_THRESHOLD: 10,
    MAX_STOCK_LEVEL: 100,
    BILL_PREFIX: 'INV',
    CURRENCY: 'INR',
    TAX_RATE: 0
  }
};