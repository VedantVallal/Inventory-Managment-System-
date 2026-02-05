const { body, validationResult } = require('express-validator');
const { sendError } = require('../utils/helpers');

/**
 * Validation middleware wrapper
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Extract error messages
    const extractedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return sendError(res, 400, 'Validation failed', extractedErrors);
  };
};

/**
 * Registration validation rules
 */
const registerValidation = [
  body('businessName')
    .trim()
    .notEmpty().withMessage('Business name is required')
    .isLength({ min: 2, max: 255 }).withMessage('Business name must be 2-255 characters'),
  
  body('ownerName')
    .trim()
    .notEmpty().withMessage('Owner name is required')
    .isLength({ min: 2, max: 255 }).withMessage('Owner name must be 2-255 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number format'),
  
  body('gstNumber')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('GST number too long'),
  
  body('address')
    .optional({ checkFalsy: true })
    .trim(),
  
  body('currency')
    .optional({ checkFalsy: true })
    .trim()
];

/**
 * Login validation rules
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Forgot password validation
 */
const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
];

/**
 * Reset password validation
 */
const resetPasswordValidation = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('token')
    .notEmpty().withMessage('Reset token is required')
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
};