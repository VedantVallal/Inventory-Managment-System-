const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const { ROLES } = require('../config/constants');
const { sendSuccess, sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Generate JWT Token
 */
const generateToken = (userId, businessId, role) => {
  return jwt.sign(
    {
      userId,
      businessId,
      role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * @desc    Register new business (Admin user)
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const {
      businessName,
      ownerName,
      email,
      phone,
      password,
      address,
      gstNumber,
      currency
    } = req.body;

    // Validate required fields
    if (!businessName || !ownerName || !email || !password) {
      return sendError(res, 400, 'Please provide all required fields');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Invalid email format');
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters long');
    }

    // Check if business email already exists
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id')
      .eq('email', email)
      .single();

    if (existingBusiness) {
      return sendError(res, 400, 'Business with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create business record
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert([
        {
          business_name: businessName,
          owner_name: ownerName,
          email: email,
          phone: phone || null,
          address: address || null,
          gst_number: gstNumber || null,
          currency: currency || 'INR',
          tax_rate: 0
        }
      ])
      .select()
      .single();

    if (businessError) {
      logger.error('Error creating business:', businessError);
      return sendError(res, 500, 'Failed to create business', businessError.message);
    }

    // Create admin user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        {
          business_id: business.id,
          email: email,
          full_name: ownerName,
          phone: phone || null,
          role: ROLES.ADMIN,
          is_active: true
        }
      ])
      .select()
      .single();

    if (userError) {
      // Rollback: Delete business if user creation fails
      await supabase.from('businesses').delete().eq('id', business.id);
      logger.error('Error creating user:', userError);
      return sendError(res, 500, 'Failed to create user account', userError.message);
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: ownerName,
        business_id: business.id,
        role: ROLES.ADMIN
      }
    });

    if (authError) {
      // Rollback: Delete user and business
      await supabase.from('users').delete().eq('id', user.id);
      await supabase.from('businesses').delete().eq('id', business.id);
      logger.error('Error creating auth user:', authError);
      return sendError(res, 500, 'Failed to create authentication', authError.message);
    }

    // Create default settings for business
    await supabase
      .from('settings')
      .insert([
        {
          business_id: business.id,
          low_stock_threshold_default: 10,
          enable_email_alerts: true,
          enable_expiry_alerts: true,
          bill_prefix: 'INV',
          currency_symbol: currency === 'INR' ? '₹' : '$'
        }
      ]);

    // Generate JWT token
    const token = generateToken(user.id, business.id, user.role);

    logger.success('User registered successfully:', email);

    // Send response
    return sendSuccess(res, 201, 'Registration successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        businessId: business.id,
        businessName: business.business_name
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    return sendError(res, 500, 'Server error during registration', error.message);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendError(res, 400, 'Please provide email and password');
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      logger.error('Login failed:', authError.message);
      return sendError(res, 401, 'Invalid email or password');
    }

    // Get user details from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        business_id,
        is_active,
        businesses (
          id,
          business_name,
          owner_name,
          currency
        )
      `)
      .eq('email', email)
      .single();

    if (userError || !user) {
      logger.error('User not found:', userError);
      return sendError(res, 404, 'User not found');
    }

    // Check if user is active
    if (!user.is_active) {
      return sendError(res, 403, 'Account is deactivated. Please contact admin.');
    }

    // Generate JWT token
    const token = generateToken(user.id, user.business_id, user.role);

    logger.success('User logged in:', email);

    // Send response
    return sendSuccess(res, 200, 'Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        businessId: user.business_id,
        businessName: business.business_name,
        currency: business.currency
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    return sendError(res, 500, 'Server error during login', error.message);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user details
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        business_id,
        is_active,
        created_at,
        businesses (
          id,
          business_name,
          owner_name,
          email,
          phone,
          address,
          logo_url,
          currency,
          gst_number
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User details retrieved', {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        businessId: user.business_id,
        isActive: user.is_active,
        createdAt: user.created_at,
        business: user.businesses
      }
    });

  } catch (error) {
    logger.error('Get me error:', error);
    return sendError(res, 500, 'Failed to get user details', error.message);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // In JWT-based auth, logout is handled on client side by removing token
    // But we can track it in logs
    logger.info('User logged out:', req.user.userId);

    return sendSuccess(res, 200, 'Logout successful', null);

  } catch (error) {
    logger.error('Logout error:', error);
    return sendError(res, 500, 'Logout failed', error.message);
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Please provide email address');
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return sendSuccess(res, 200, 'If email exists, password reset link has been sent');
    }

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      logger.error('Password reset error:', error);
      return sendError(res, 500, 'Failed to send reset email');
    }

    logger.info('Password reset email sent to:', email);

    return sendSuccess(res, 200, 'Password reset link has been sent to your email');

  } catch (error) {
    logger.error('Forgot password error:', error);
    return sendError(res, 500, 'Server error', error.message);
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/reset-password
 * @access  Public (with reset token)
 */
const resetPassword = async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!password || !token) {
      return sendError(res, 400, 'Please provide password and token');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters');
    }

    // Update password via Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      logger.error('Password reset failed:', error);
      return sendError(res, 400, 'Invalid or expired reset token');
    }

    logger.success('Password reset successful');

    return sendSuccess(res, 200, 'Password reset successful. You can now login with new password');

  } catch (error) {
    logger.error('Reset password error:', error);
    return sendError(res, 500, 'Server error', error.message);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword
};