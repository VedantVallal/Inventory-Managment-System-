const { supabase } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * @desc    Get all customers
 * @route   GET /api/v1/customers
 * @access  Private
 */
const getAllCustomers = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { search } = req.query;

        let query = supabase
            .from('customers')
            .select('*')
            .eq('business_id', businessId)
            .order('customer_name', { ascending: true });

        if (search) {
            query = query.or(`customer_name.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data: customers, error } = await query;

        if (error) {
            logger.error('Error fetching customers:', error);
            return sendError(res, 500, 'Failed to fetch customers', error.message);
        }

        return sendSuccess(res, 200, 'Customers retrieved successfully', { customers });

    } catch (error) {
        logger.error('Get customers error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Get single customer with purchase history
 * @route   GET /api/v1/customers/:id
 * @access  Private
 */
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        const { data: customer, error } = await supabase
            .from('customers')
            .select(`
        *,
        bills (
          id,
          bill_number,
          bill_date,
          total_amount,
          payment_status
        )
      `)
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (error || !customer) {
            return sendError(res, 404, 'Customer not found');
        }

        return sendSuccess(res, 200, 'Customer retrieved successfully', { customer });

    } catch (error) {
        logger.error('Get customer error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Create customer
 * @route   POST /api/v1/customers
 * @access  Private
 */
const createCustomer = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { customerName, phone, email, address } = req.body;

        if (!customerName || !phone) {
            return sendError(res, 400, 'Please provide customer name and phone');
        }

        const { data: customer, error } = await supabase
            .from('customers')
            .insert([{
                business_id: businessId,
                customer_name: customerName,
                phone,
                email: email || null,
                address: address || null,
                total_purchases: 0
            }])
            .select()
            .single();

        if (error) {
            logger.error('Error creating customer:', error);
            return sendError(res, 500, 'Failed to create customer', error.message);
        }

        logger.success('Customer created:', customerName);

        return sendSuccess(res, 201, 'Customer created successfully', { customer });

    } catch (error) {
        logger.error('Create customer error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Update customer
 * @route   PUT /api/v1/customers/:id
 * @access  Private
 */
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;
        const { customerName, phone, email, address } = req.body;

        const updateData = {};
        if (customerName) updateData.customer_name = customerName;
        if (phone) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (address !== undefined) updateData.address = address;

        const { data: customer, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            logger.error('Error updating customer:', error);
            return sendError(res, 500, 'Failed to update customer', error.message);
        }

        return sendSuccess(res, 200, 'Customer updated successfully', { customer });

    } catch (error) {
        logger.error('Update customer error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Delete customer
 * @route   DELETE /api/v1/customers/:id
 * @access  Private
 */
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id)
            .eq('business_id', businessId);

        if (error) {
            logger.error('Error deleting customer:', error);
            return sendError(res, 500, 'Failed to delete customer', error.message);
        }

        logger.success('Customer deleted:', id);

        return sendSuccess(res, 200, 'Customer deleted successfully', null);

    } catch (error) {
        logger.error('Delete customer error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};
