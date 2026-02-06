/**
 * Currency Utility Functions
 * Standardizes currency formatting across the application
 */

/**
 * Format amount in Indian Rupees (₹)
 * @param {number|string} amount - The amount to format
 * @param {boolean} includeSymbol - Whether to include the ₹ symbol (default: true)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, includeSymbol = true) => {
    const numAmount = parseFloat(amount) || 0;
    const formatted = numAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return includeSymbol ? `₹ ${formatted}` : formatted;
};

/**
 * Format amount without decimals
 * @param {number|string} amount - The amount to format
 * @param {boolean} includeSymbol - Whether to include the ₹ symbol (default: true)
 * @returns {string} Formatted currency string without decimals
 */
export const formatCurrencyWhole = (amount, includeSymbol = true) => {
    const numAmount = parseFloat(amount) || 0;
    const formatted = Math.round(numAmount).toLocaleString('en-IN');

    return includeSymbol ? `₹ ${formatted}` : formatted;
};

/**
 * Parse currency string to number
 * @param {string} currencyString - Currency string to parse
 * @returns {number} Parsed number
 */
export const parseCurrency = (currencyString) => {
    if (typeof currencyString === 'number') return currencyString;
    const cleaned = currencyString.replace(/[₹,\s]/g, '');
    return parseFloat(cleaned) || 0;
};

/**
 * Format currency for input fields (no symbol, with decimals)
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted amount for input
 */
export const formatCurrencyInput = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return numAmount.toFixed(2);
};
