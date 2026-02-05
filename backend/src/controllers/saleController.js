const { supabase } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * @desc    Get all bills for a business
 * @route   GET /api/v1/bills
 * @access  Private
 */
const getAllBills = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { page = 1, limit = 20, search, startDate, endDate, paymentStatus } = req.query;

        let query = supabase
            .from('bills')
            .select(`
        *,
        customers (
          id,
          customer_name,
          phone
        ),
        users!bills_created_by_fkey (
          id,
          full_name
        )
      `, { count: 'exact' })
            .eq('business_id', businessId)
            .order('bill_date', { ascending: false });

        // Apply filters
        if (search) {
            query = query.or(`bill_number.ilike.%${search}%,customers.customer_name.ilike.%${search}%`);
        }

        if (startDate) {
            query = query.gte('bill_date', startDate);
        }

        if (endDate) {
            query = query.lte('bill_date', endDate);
        }

        if (paymentStatus) {
            query = query.eq('payment_status', paymentStatus);
        }

        // Pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: bills, error, count } = await query;

        if (error) {
            logger.error('Error fetching bills:', error);
            return sendError(res, 500, 'Failed to fetch bills', error.message);
        }

        return sendSuccess(res, 200, 'Bills retrieved successfully', {
            bills,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Get bills error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Get single bill by ID
 * @route   GET /api/v1/bills/:id
 * @access  Private
 */
const getBillById = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        const { data: bill, error } = await supabase
            .from('bills')
            .select(`
        *,
        customers (
          id,
          customer_name,
          phone,
          email,
          address
        ),
        users!bills_created_by_fkey (
          id,
          full_name
        ),
        bill_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          discount_percentage,
          discount_amount,
          tax_percentage,
          tax_amount,
          subtotal,
          total,
          products (
            id,
            product_name,
            sku,
            unit
          )
        )
      `)
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (error || !bill) {
            return sendError(res, 404, 'Bill not found');
        }

        return sendSuccess(res, 200, 'Bill retrieved successfully', { bill });

    } catch (error) {
        logger.error('Get bill error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Create new bill (with automatic stock deduction)
 * @route   POST /api/v1/bills
 * @access  Private
 */
const createBill = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const userId = req.user.userId;
        const {
            customerId,
            items, // Array of { productId, quantity, unitPrice, discountPercentage, taxPercentage }
            discountPercentage = 0,
            taxPercentage = 0,
            paymentMethod,
            paymentStatus = 'paid',
            paidAmount = 0,
            notes
        } = req.body;

        // Validation
        if (!items || items.length === 0) {
            return sendError(res, 400, 'Please provide at least one item');
        }

        if (!paymentMethod) {
            return sendError(res, 400, 'Please provide payment method');
        }

        // Get business settings for bill prefix
        const { data: settings } = await supabase
            .from('settings')
            .select('bill_prefix, default_tax_percentage')
            .eq('business_id', businessId)
            .single();

        const billPrefix = settings?.bill_prefix || 'INV';

        // Generate bill number
        const { data: billCount } = await supabase
            .from('bills')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', businessId);

        const billNumber = `${billPrefix}-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String((billCount?.length || 0) + 1).padStart(4, '0')}`;

        // Calculate totals
        let subtotal = 0;
        const processedItems = [];

        for (const item of items) {
            const { productId, quantity, unitPrice, discountPercentage: itemDiscount = 0, taxPercentage: itemTax = 0 } = item;

            // Validate product exists and has sufficient stock
            const { data: product, error: productError } = await supabase
                .from('products')
                .select('id, product_name, current_stock, sku, unit')
                .eq('id', productId)
                .eq('business_id', businessId)
                .single();

            if (productError || !product) {
                return sendError(res, 404, `Product with ID ${productId} not found`);
            }

            if (product.current_stock < quantity) {
                return sendError(res, 400, `Insufficient stock for ${product.product_name}. Available: ${product.current_stock}, Requested: ${quantity}`);
            }

            // Calculate item totals
            const itemSubtotal = quantity * unitPrice;
            const itemDiscountAmount = (itemSubtotal * itemDiscount) / 100;
            const itemTaxableAmount = itemSubtotal - itemDiscountAmount;
            const itemTaxAmount = (itemTaxableAmount * itemTax) / 100;
            const itemTotal = itemTaxableAmount + itemTaxAmount;

            subtotal += itemSubtotal;

            processedItems.push({
                product_id: productId,
                product_name: product.product_name,
                quantity,
                unit_price: unitPrice,
                discount_percentage: itemDiscount,
                discount_amount: itemDiscountAmount,
                tax_percentage: itemTax,
                tax_amount: itemTaxAmount,
                subtotal: itemSubtotal,
                total: itemTotal
            });
        }

        // Calculate bill totals
        const billDiscountAmount = (subtotal * discountPercentage) / 100;
        const taxableAmount = subtotal - billDiscountAmount;
        const billTaxAmount = (taxableAmount * taxPercentage) / 100;
        const totalAmount = taxableAmount + billTaxAmount;
        const balanceAmount = totalAmount - paidAmount;

        // Create bill
        const { data: bill, error: billError } = await supabase
            .from('bills')
            .insert([{
                business_id: businessId,
                customer_id: customerId || null,
                bill_number: billNumber,
                bill_date: new Date().toISOString().split('T')[0],
                subtotal,
                discount_percentage: discountPercentage,
                discount_amount: billDiscountAmount,
                tax_percentage: taxPercentage,
                tax_amount: billTaxAmount,
                total_amount: totalAmount,
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                paid_amount: paidAmount,
                balance_amount: balanceAmount,
                notes: notes || null,
                created_by: userId
            }])
            .select()
            .single();

        if (billError) {
            logger.error('Error creating bill:', billError);
            return sendError(res, 500, 'Failed to create bill', billError.message);
        }

        // Insert bill items
        const billItemsWithBillId = processedItems.map(item => ({
            ...item,
            bill_id: bill.id
        }));

        const { error: itemsError } = await supabase
            .from('bill_items')
            .insert(billItemsWithBillId);

        if (itemsError) {
            // Rollback: Delete bill if items insertion fails
            await supabase.from('bills').delete().eq('id', bill.id);
            logger.error('Error creating bill items:', itemsError);
            return sendError(res, 500, 'Failed to create bill items', itemsError.message);
        }

        // Update stock for each product (CRITICAL: Stock deduction)
        for (const item of items) {
            const { productId, quantity } = item;

            const { error: stockError } = await supabase
                .from('products')
                .update({
                    current_stock: supabase.raw(`current_stock - ${quantity}`)
                })
                .eq('id', productId)
                .eq('business_id', businessId);

            if (stockError) {
                logger.error('Error updating stock:', stockError);
                // Note: In production, you might want to implement transaction rollback here
            }
        }

        // Record payment if paid
        if (paidAmount > 0) {
            await supabase
                .from('payments')
                .insert([{
                    business_id: businessId,
                    bill_id: bill.id,
                    payment_date: new Date().toISOString().split('T')[0],
                    amount: paidAmount,
                    payment_method: paymentMethod,
                    received_by: userId
                }]);
        }

        // Update customer total purchases
        if (customerId) {
            await supabase.raw(`
        UPDATE customers 
        SET total_purchases = total_purchases + ${totalAmount}
        WHERE id = '${customerId}'
      `);
        }

        logger.success('Bill created successfully:', billNumber);

        return sendSuccess(res, 201, 'Bill created successfully', {
            bill: {
                ...bill,
                items: billItemsWithBillId
            }
        });

    } catch (error) {
        logger.error('Create bill error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Update bill
 * @route   PUT /api/v1/bills/:id
 * @access  Private (Admin only)
 */
const updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;
        const { paymentStatus, paidAmount, notes } = req.body;

        // Get existing bill
        const { data: existingBill, error: fetchError } = await supabase
            .from('bills')
            .select('*')
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (fetchError || !existingBill) {
            return sendError(res, 404, 'Bill not found');
        }

        // Update bill
        const updateData = {};
        if (paymentStatus) updateData.payment_status = paymentStatus;
        if (paidAmount !== undefined) {
            updateData.paid_amount = paidAmount;
            updateData.balance_amount = existingBill.total_amount - paidAmount;
        }
        if (notes !== undefined) updateData.notes = notes;

        const { data: bill, error } = await supabase
            .from('bills')
            .update(updateData)
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            logger.error('Error updating bill:', error);
            return sendError(res, 500, 'Failed to update bill', error.message);
        }

        return sendSuccess(res, 200, 'Bill updated successfully', { bill });

    } catch (error) {
        logger.error('Update bill error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Delete bill (Admin only)
 * @route   DELETE /api/v1/bills/:id
 * @access  Private (Admin only)
 */
const deleteBill = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        // Check if bill exists
        const { data: bill, error: fetchError } = await supabase
            .from('bills')
            .select('*')
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (fetchError || !bill) {
            return sendError(res, 404, 'Bill not found');
        }

        // Delete bill (cascade will delete bill_items)
        const { error } = await supabase
            .from('bills')
            .delete()
            .eq('id', id)
            .eq('business_id', businessId);

        if (error) {
            logger.error('Error deleting bill:', error);
            return sendError(res, 500, 'Failed to delete bill', error.message);
        }

        logger.success('Bill deleted:', id);

        return sendSuccess(res, 200, 'Bill deleted successfully', null);

    } catch (error) {
        logger.error('Delete bill error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

module.exports = {
    getAllBills,
    getBillById,
    createBill,
    updateBill,
    deleteBill
};
