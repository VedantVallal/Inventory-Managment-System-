import React, { useState, useEffect } from 'react';
import { Plus, Eye, Trash2 } from 'lucide-react';
import saleService from '../services/sale.service';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Sales = () => {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const response = await saleService.getAll();


            if (response.success && response.data) {
                // Backend returns 'bills', ensure we handle both 'sales' and 'bills'
                const salesData = response.data.sales || response.data.bills || [];
                if (Array.isArray(salesData)) {
                    setSales(salesData);
                } else {
                    setSales([]);
                }
            } else {
                setSales([]);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
            setSales([]);
            toast.error('Failed to load sales');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSale = async (saleId) => {
        if (!window.confirm('Are you sure you want to delete this sale?')) {
            return;
        }

        try {
            const response = await saleService.delete(saleId);
            if (response.success) {
                toast.success('Sale deleted successfully');
                fetchSales();
            }
        } catch (error) {
            console.error('Error deleting sale:', error);
            toast.error('Failed to delete sale');
        }
    };

    const getPaymentBadge = (method) => {
        const badges = {
            cash: { variant: 'success', text: 'Cash' },
            card: { variant: 'info', text: 'Card' },
            upi: { variant: 'info', text: 'UPI' },
            credit: { variant: 'warning', text: 'Credit' },
        };
        return badges[method] || { variant: 'default', text: method };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-navy mb-2">Sales</h1>
                        <p className="text-text-muted">Manage your sales and invoices</p>
                    </div>
                    <Button variant="primary" icon={Plus} onClick={() => navigate('/sales/create')}>
                        New Sale
                    </Button>
                </div>

                {/* Sales Table */}
                <div className="bg-white rounded-card shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200 bg-bg-secondary">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Invoice #</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Customer</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Total Qty</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Total</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Payment</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!Array.isArray(sales) || sales.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-text-muted">
                                            No sales found. Click "New Sale" to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    sales.map((sale) => {
                                        const badge = getPaymentBadge(sale.payment_method);
                                        return (
                                            <tr
                                                key={sale.id}
                                                className="border-b border-gray-200 hover:bg-bg-primary transition-colors"
                                            >
                                                <td className="px-6 py-4 font-medium text-text-primary">
                                                    #{sale.invoice_number}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-text-secondary">
                                                    {new Date(sale.sale_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-text-secondary">
                                                    {sale.customers?.customer_name || 'Walk-in'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-text-secondary">
                                                    {sale.total_items || 0} units
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-text-primary">
                                                    ₹{parseFloat(sale.total_amount).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={badge.variant}>{badge.text}</Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => navigate(`/sales/${sale.id}`)}
                                                            className="p-2 hover:bg-cyan-50 rounded-lg transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye size={18} className="text-cyan" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSale(sale.id)}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} className="text-red-600" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary */}
                <div className="mt-6 text-sm text-text-muted">
                    Showing {Array.isArray(sales) ? sales.length : 0} sales
                </div>
            </div>
        </div>
    );
};

export default Sales;
