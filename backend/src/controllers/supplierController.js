const { supabase } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * @desc    Get all suppliers
 * @route   GET /api/v1/suppliers
 * @access  Private
 */
const getAllSuppliers = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { search } = req.query;

        let query = supabase
            .from('suppliers')
            .select('*')
            .eq('business_id', businessId)
            .order('supplier_name', { ascending: true });

        if (search) {
            query = query.or(`supplier_name.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data: suppliers, error } = await query;

        if (error) {
            logger.error('Error fetching suppliers:', error);
            return sendError(res, 500, 'Failed to fetch suppliers', error.message);
        }

        return sendSuccess(res, 200, 'Suppliers retrieved successfully', { suppliers });

    } catch (error) {
        logger.error('Get suppliers error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Get single supplier
 * @route   GET /api/v1/suppliers/:id
 * @access  Private
 */
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        const { data: supplier, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (error || !supplier) {
            return sendError(res, 404, 'Supplier not found');
        }

        return sendSuccess(res, 200, 'Supplier retrieved successfully', { supplier });

    } catch (error) {
        logger.error('Get supplier error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Create supplier
 * @route   POST /api/v1/suppliers
 * @access  Private
 */
const createSupplier = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { supplierName, contactPerson, phone, email, address, gstNumber } = req.body;

        if (!supplierName || !phone) {
            return sendError(res, 400, 'Please provide supplier name and phone');
        }

        const { data: supplier, error } = await supabase
            .from('suppliers')
            .insert([{
                business_id: businessId,
                supplier_name: supplierName,
                contact_person: contactPerson || null,
                phone,
                email: email || null,
                address: address || null,
                gst_number: gstNumber || null
            }])
            .select()
            .single();

        if (error) {
            logger.error('Error creating supplier:', error);
            return sendError(res, 500, 'Failed to create supplier', error.message);
        }

        logger.success('Supplier created:', supplierName);

        return sendSuccess(res, 201, 'Supplier created successfully', { supplier });

    } catch (error) {
        logger.error('Create supplier error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Update supplier
 * @route   PUT /api/v1/suppliers/:id
 * @access  Private
 */
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;
        const { supplierName, contactPerson, phone, email, address, gstNumber } = req.body;

        const updateData = {};
        if (supplierName) updateData.supplier_name = supplierName;
        if (contactPerson !== undefined) updateData.contact_person = contactPerson;
        if (phone) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (address !== undefined) updateData.address = address;
        if (gstNumber !== undefined) updateData.gst_number = gstNumber;

        const { data: supplier, error } = await supabase
            .from('suppliers')
            .update(updateData)
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            logger.error('Error updating supplier:', error);
            return sendError(res, 500, 'Failed to update supplier', error.message);
        }

        return sendSuccess(res, 200, 'Supplier updated successfully', { supplier });

    } catch (error) {
        logger.error('Update supplier error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Delete supplier
 * @route   DELETE /api/v1/suppliers/:id
 * @access  Private
 */
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', id)
            .eq('business_id', businessId);

        if (error) {
            logger.error('Error deleting supplier:', error);
            return sendError(res, 500, 'Failed to delete supplier', error.message);
        }

        logger.success('Supplier deleted:', id);

        return sendSuccess(res, 200, 'Supplier deleted successfully', null);

    } catch (error) {
        logger.error('Delete supplier error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

module.exports = {
    getAllSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
};
