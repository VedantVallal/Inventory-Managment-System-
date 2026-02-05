const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const {
  validate,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} = require('../middlewares/validator');

// Public routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/forgot-password', validate(forgotPasswordValidation), forgotPassword);
router.post('/reset-password', validate(resetPasswordValidation), resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;