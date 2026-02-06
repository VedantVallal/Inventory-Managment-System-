import React, { forwardRef } from 'react';

/**
 * Receipt Component
 * 
 * Thermal printer optimized (80mm width)
 * Professional receipt layout for POS system
 */

const Receipt = forwardRef(({ bill }, ref) => {
    if (!bill) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div ref={ref} className="receipt" style={{ width: '80mm', fontFamily: 'monospace', fontSize: '12px', padding: '10mm' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0' }}>STOCKFLOW</h1>
                <p style={{ margin: '2px 0', fontSize: '11px' }}>Inventory Management System</p>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>123 Main Street, City - 400001</p>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>Phone: +91 1234567890</p>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>GSTIN: 27XXXXX1234X1ZX</p>
            </div>

            {/* Bill Info */}
            <div style={{ marginBottom: '10px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span><strong>Bill No:</strong></span>
                    <span>{bill.billNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span><strong>Date:</strong></span>
                    <span>{formatDate(bill.date)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span><strong>Cashier:</strong></span>
                    <span>{bill.cashierName || 'Cashier'}</span>
                </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

            {/* Items Table */}
            <table style={{ width: '100%', fontSize: '11px', marginBottom: '10px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ textAlign: 'left', padding: '5px 0' }}>Item</th>
                        <th style={{ textAlign: 'center', padding: '5px 0' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '5px 0' }}>Price</th>
                        <th style={{ textAlign: 'right', padding: '5px 0' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.items && bill.items.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px dotted #ccc' }}>
                            <td style={{ padding: '5px 0', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.name}
                            </td>
                            <td style={{ textAlign: 'center', padding: '5px 0' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '5px 0' }}>₹{item.price.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '5px 0' }}>₹{item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Divider */}
            <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

            {/* Totals */}
            <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Subtotal:</span>
                    <span>₹{bill.subtotal.toFixed(2)}</span>
                </div>

                {bill.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#d32f2f' }}>
                        <span>Discount:</span>
                        <span>-₹{bill.discount.toFixed(2)}</span>
                    </div>
                )}

                {bill.tax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Tax:</span>
                        <span>₹{bill.tax.toFixed(2)}</span>
                    </div>
                )}

                <div style={{ borderTop: '2px solid #000', paddingTop: '8px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold' }}>
                        <span>TOTAL:</span>
                        <span>₹{bill.total.toFixed(2)}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px' }}>
                    <span>Payment Method:</span>
                    <span style={{ textTransform: 'uppercase' }}>{bill.paymentMethod}</span>
                </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '15px' }}>
                <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Thank You for Shopping!</p>
                <p style={{ margin: '5px 0' }}>Please Visit Again</p>
                <p style={{ margin: '10px 0 5px 0', fontSize: '10px' }}>
                    Goods once sold cannot be returned
                </p>
                <p style={{ margin: '5px 0', fontSize: '10px' }}>
                    For queries: support@stockflow.com
                </p>
            </div>

            {/* Barcode/QR (optional) */}
            <div style={{ textAlign: 'center', marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #000' }}>
                <p style={{ fontSize: '10px', margin: '5px 0' }}>Scan for digital receipt</p>
                <div style={{ height: '40px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '5px 0' }}>
                    <span style={{ fontSize: '9px', color: '#666' }}>[QR CODE PLACEHOLDER]</span>
                </div>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';

export default Receipt;
