const logger = require('./logger');

/**
 * CSV Parser Utility
 * Handles CSV file parsing and generation
 */

/**
 * Parse CSV string to array of objects
 */
const parseCSV = (csvString, delimiter = ',') => {
    try {
        const lines = csvString.trim().split('\n');
        if (lines.length === 0) {
            return [];
        }

        // Get headers from first line
        const headers = lines[0].split(delimiter).map(h => h.trim());

        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim());

            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }

        return data;
    } catch (error) {
        logger.error('Parse CSV error:', error);
        return [];
    }
};

/**
 * Convert array of objects to CSV string
 */
const arrayToCSV = (data, headers = null) => {
    try {
        if (!data || data.length === 0) {
            return '';
        }

        // Use provided headers or extract from first object
        const csvHeaders = headers || Object.keys(data[0]);

        // Create header row
        let csv = csvHeaders.join(',') + '\n';

        // Add data rows
        data.forEach(row => {
            const values = csvHeaders.map(header => {
                const value = row[header] || '';
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csv += values.join(',') + '\n';
        });

        return csv;
    } catch (error) {
        logger.error('Array to CSV error:', error);
        return '';
    }
};

/**
 * Generate CSV for products export
 */
const generateProductsCSV = (products) => {
    const headers = [
        'Product Name',
        'SKU',
        'Category',
        'Current Stock',
        'Min Stock',
        'Max Stock',
        'Purchase Price',
        'Selling Price',
        'Unit'
    ];

    const data = products.map(p => ({
        'Product Name': p.product_name,
        'SKU': p.sku || '',
        'Category': p.categories?.category_name || 'Uncategorized',
        'Current Stock': p.current_stock,
        'Min Stock': p.min_stock_level,
        'Max Stock': p.max_stock_level,
        'Purchase Price': p.purchase_price,
        'Selling Price': p.selling_price,
        'Unit': p.unit
    }));

    return arrayToCSV(data, headers);
};

/**
 * Generate CSV for sales report
 */
const generateSalesCSV = (bills) => {
    const headers = [
        'Bill Number',
        'Date',
        'Customer',
        'Subtotal',
        'Discount',
        'Tax',
        'Total',
        'Payment Method',
        'Payment Status'
    ];

    const data = bills.map(b => ({
        'Bill Number': b.bill_number,
        'Date': b.bill_date,
        'Customer': b.customers?.customer_name || 'Walk-in',
        'Subtotal': b.subtotal,
        'Discount': b.discount_amount || 0,
        'Tax': b.tax_amount || 0,
        'Total': b.total_amount,
        'Payment Method': b.payment_method,
        'Payment Status': b.payment_status
    }));

    return arrayToCSV(data, headers);
};

/**
 * Generate CSV for stock summary
 */
const generateStockSummaryCSV = (products) => {
    const headers = [
        'Product Name',
        'SKU',
        'Current Stock',
        'Status',
        'Purchase Price',
        'Stock Value'
    ];

    const data = products.map(p => {
        let status = 'In Stock';
        if (p.current_stock === 0) status = 'Out of Stock';
        else if (p.current_stock < p.min_stock_level) status = 'Low Stock';
        else if (p.current_stock > p.max_stock_level) status = 'Overstock';

        return {
            'Product Name': p.product_name,
            'SKU': p.sku || '',
            'Current Stock': p.current_stock,
            'Status': status,
            'Purchase Price': p.purchase_price,
            'Stock Value': (p.current_stock * p.purchase_price).toFixed(2)
        };
    });

    return arrayToCSV(data, headers);
};

/**
 * Parse product import CSV
 */
const parseProductImportCSV = (csvString) => {
    const products = parseCSV(csvString);

    // Validate and transform
    return products.map(p => ({
        productName: p['Product Name'] || p.productName,
        sku: p['SKU'] || p.sku,
        categoryName: p['Category'] || p.category,
        currentStock: parseInt(p['Current Stock'] || p.currentStock || 0),
        minStockLevel: parseInt(p['Min Stock'] || p.minStock || 5),
        maxStockLevel: parseInt(p['Max Stock'] || p.maxStock || 100),
        purchasePrice: parseFloat(p['Purchase Price'] || p.purchasePrice || 0),
        sellingPrice: parseFloat(p['Selling Price'] || p.sellingPrice || 0),
        unit: p['Unit'] || p.unit || 'pcs'
    }));
};

module.exports = {
    parseCSV,
    arrayToCSV,
    generateProductsCSV,
    generateSalesCSV,
    generateStockSummaryCSV,
    parseProductImportCSV
};
