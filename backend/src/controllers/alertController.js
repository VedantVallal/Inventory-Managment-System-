const { supabase } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * @desc    Get all alerts
 * @route   GET /api/v1/alerts
 * @access  Private
 */
const getAllAlerts = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { isRead, alertType } = req.query;

        let query = supabase
            .from('alerts')
            .select(`
        *,
        products (
          id,
          product_name,
          sku,
          current_stock,
          min_stock_level
        )
      `)
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (isRead !== undefined) {
            query = query.eq('is_read', isRead === 'true');
        }

        if (alertType) {
            query = query.eq('alert_type', alertType);
        }

        const { data: alerts, error } = await query;

        if (error) {
            logger.error('Error fetching alerts:', error);
            return sendError(res, 500, 'Failed to fetch alerts', error.message);
        }

        return sendSuccess(res, 200, 'Alerts retrieved successfully', { alerts });

    } catch (error) {
        logger.error('Get alerts error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Mark alert as read
 * @route   PUT /api/v1/alerts/:id/read
 * @access  Private
 */
const markAlertAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        const { data: alert, error } = await supabase
            .from('alerts')
            .update({ is_read: true })
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            logger.error('Error marking alert as read:', error);
            return sendError(res, 500, 'Failed to mark alert as read', error.message);
        }

        return sendSuccess(res, 200, 'Alert marked as read', { alert });

    } catch (error) {
        logger.error('Mark alert as read error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Mark alert as resolved
 * @route   PUT /api/v1/alerts/:id/resolve
 * @access  Private
 */
const markAlertAsResolved = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        const { data: alert, error } = await supabase
            .from('alerts')
            .update({ is_resolved: true, is_read: true })
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            logger.error('Error resolving alert:', error);
            return sendError(res, 500, 'Failed to resolve alert', error.message);
        }

        return sendSuccess(res, 200, 'Alert resolved successfully', { alert });

    } catch (error) {
        logger.error('Resolve alert error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Delete alert
 * @route   DELETE /api/v1/alerts/:id
 * @access  Private
 */
const deleteAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        const { error } = await supabase
            .from('alerts')
            .delete()
            .eq('id', id)
            .eq('business_id', businessId);

        if (error) {
            logger.error('Error deleting alert:', error);
            return sendError(res, 500, 'Failed to delete alert', error.message);
        }

        return sendSuccess(res, 200, 'Alert deleted successfully', null);

    } catch (error) {
        logger.error('Delete alert error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

module.exports = {
    getAllAlerts,
    markAlertAsRead,
    markAlertAsResolved,
    deleteAlert
};
