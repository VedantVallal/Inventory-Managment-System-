const { supabase } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/helpers');
const { ROLES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * @desc    Get business settings
 * @route   GET /api/v1/settings
 * @access  Private
 */
const getSettings = async (req, res) => {
    try {
        const businessId = req.user.businessId;

        const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .eq('business_id', businessId)
            .single();

        if (error) {
            logger.error('Error fetching settings:', error);
            return sendError(res, 500, 'Failed to fetch settings', error.message);
        }

        return sendSuccess(res, 200, 'Settings retrieved successfully', { settings });

    } catch (error) {
        logger.error('Get settings error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Update business settings (Admin only)
 * @route   PUT /api/v1/settings
 * @access  Private (Admin only)
 */
const updateSettings = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const {
            lowStockThresholdDefault,
            enableEmailAlerts,
            enableExpiryAlerts,
            enableOverstockAlerts,
            billPrefix,
            defaultTaxPercentage,
            currencySymbol
        } = req.body;

        const updateData = {};
        if (lowStockThresholdDefault !== undefined) updateData.low_stock_threshold_default = lowStockThresholdDefault;
        if (enableEmailAlerts !== undefined) updateData.enable_email_alerts = enableEmailAlerts;
        if (enableExpiryAlerts !== undefined) updateData.enable_expiry_alerts = enableExpiryAlerts;
        if (enableOverstockAlerts !== undefined) updateData.enable_overstock_alerts = enableOverstockAlerts;
        if (billPrefix) updateData.bill_prefix = billPrefix;
        if (defaultTaxPercentage !== undefined) updateData.default_tax_percentage = defaultTaxPercentage;
        if (currencySymbol) updateData.currency_symbol = currencySymbol;

        const { data: settings, error } = await supabase
            .from('settings')
            .update(updateData)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            logger.error('Error updating settings:', error);
            return sendError(res, 500, 'Failed to update settings', error.message);
        }

        logger.success('Settings updated for business:', businessId);

        return sendSuccess(res, 200, 'Settings updated successfully', { settings });

    } catch (error) {
        logger.error('Update settings error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Get business profile
 * @route   GET /api/v1/settings/business
 * @access  Private
 */
const getBusinessProfile = async (req, res) => {
    try {
        const businessId = req.user.businessId;

        const { data: business, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .single();

        if (error) {
            logger.error('Error fetching business:', error);
            return sendError(res, 500, 'Failed to fetch business profile', error.message);
        }

        return sendSuccess(res, 200, 'Business profile retrieved successfully', { business });

    } catch (error) {
        logger.error('Get business profile error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Update business profile (Admin only)
 * @route   PUT /api/v1/settings/business
 * @access  Private (Admin only)
 */
const updateBusinessProfile = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const {
            businessName,
            ownerName,
            phone,
            address,
            logoUrl,
            gstNumber,
            taxRate
        } = req.body;

        const updateData = {};
        if (businessName) updateData.business_name = businessName;
        if (ownerName) updateData.owner_name = ownerName;
        if (phone) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (logoUrl !== undefined) updateData.logo_url = logoUrl;
        if (gstNumber !== undefined) updateData.gst_number = gstNumber;
        if (taxRate !== undefined) updateData.tax_rate = taxRate;

        const { data: business, error } = await supabase
            .from('businesses')
            .update(updateData)
            .eq('id', businessId)
            .select()
            .single();

        if (error) {
            logger.error('Error updating business:', error);
            return sendError(res, 500, 'Failed to update business profile', error.message);
        }

        logger.success('Business profile updated:', businessId);

        return sendSuccess(res, 200, 'Business profile updated successfully', { business });

    } catch (error) {
        logger.error('Update business profile error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/v1/settings/users
 * @access  Private (Admin only)
 */
const getAllUsers = async (req, res) => {
    try {
        const businessId = req.user.businessId;

        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, full_name, phone, role, is_active, created_at')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Error fetching users:', error);
            return sendError(res, 500, 'Failed to fetch users', error.message);
        }

        return sendSuccess(res, 200, 'Users retrieved successfully', { users });

    } catch (error) {
        logger.error('Get users error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Add manager user (Admin only)
 * @route   POST /api/v1/settings/users
 * @access  Private (Admin only)
 */
const addManager = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { email, fullName, phone, password } = req.body;

        if (!email || !fullName || !password) {
            return sendError(res, 400, 'Please provide email, full name, and password');
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return sendError(res, 400, 'User with this email already exists');
        }

        // Create Supabase auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                business_id: businessId,
                role: ROLES.MANAGER
            }
        });

        if (authError) {
            logger.error('Error creating auth user:', authError);
            return sendError(res, 500, 'Failed to create user authentication', authError.message);
        }

        // Create user in users table
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert([{
                business_id: businessId,
                email,
                full_name: fullName,
                phone: phone || null,
                role: ROLES.MANAGER,
                is_active: true
            }])
            .select()
            .single();

        if (userError) {
            // Rollback: Delete auth user
            await supabase.auth.admin.deleteUser(authData.user.id);
            logger.error('Error creating user:', userError);
            return sendError(res, 500, 'Failed to create user', userError.message);
        }

        logger.success('Manager user created:', email);

        return sendSuccess(res, 201, 'Manager added successfully', { user });

    } catch (error) {
        logger.error('Add manager error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Deactivate user (Admin only)
 * @route   PUT /api/v1/settings/users/:id/deactivate
 * @access  Private (Admin only)
 */
const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        // Cannot deactivate yourself
        if (id === req.user.userId) {
            return sendError(res, 400, 'You cannot deactivate your own account');
        }

        const { data: user, error } = await supabase
            .from('users')
            .update({ is_active: false })
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            logger.error('Error deactivating user:', error);
            return sendError(res, 500, 'Failed to deactivate user', error.message);
        }

        logger.success('User deactivated:', id);

        return sendSuccess(res, 200, 'User deactivated successfully', { user });

    } catch (error) {
        logger.error('Deactivate user error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getBusinessProfile,
    updateBusinessProfile,
    getAllUsers,
    addManager,
    deactivateUser
};
