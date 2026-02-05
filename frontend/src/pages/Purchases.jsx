import React, { useState, useEffect } from 'react';
import { Plus, Eye, Trash2 } from 'lucide-react';
import purchaseService from '../services/purchase.service';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Purchases = () => {
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const response = await purchaseService.getAll();
            console.log('Purchases API response:', response);

            if (response.success && response.data && Array.isArray(response.data.purchases)) {
                setPurchases(response.data.purchases);
            } else {
                setPurchases([]);
            }
        } catch (error) {
            console.error('Error fetching purchases:', error);
            setPurchases([]);
            toast.error('Failed to load purchases');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePurchase = async (purchaseId) => {
        if (!window.confirm('Are you sure you want to delete this purchase?')) {
            return;
        }

        try {
            const response = await purchaseService.delete(purchaseId);
            if (response.success) {
                toast.success('Purchase deleted successfully');
                fetchPurchases();
            }
        } catch (error) {
            console.error('Error deleting purchase:', error);
            toast.error('Failed to delete purchase');
        }
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
                        <h1 className="text-3xl font-heading font-bold text-navy mb-2">Purchases</h1>
                        <p className="text-text-muted">Manage your product purchases</p>
                    </div>
                    <Button variant="primary" icon={Plus} onClick={() => navigate('/purchases/create')}>
                        New Purchase
                    </Button>
                </div>

                {/* Purchases Table */}
                <div className="bg-white rounded-card shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200 bg-bg-secondary">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Purchase #</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Supplier</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Items</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Total</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!Array.isArray(purchases) || purchases.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-text-muted">
                                            No purchases found. Click "New Purchase" to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    purchases.map((purchase) => (
                                        <tr
                                            key={purchase.id}
                                            className="border-b border-gray-200 hover:bg-bg-primary transition-colors"
                                        >
                                            <td className="px-6 py-4 font-medium text-text-primary">
                                                #{purchase.purchase_number || purchase.id.slice(0, 8)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-secondary">
                                                {new Date(purchase.purchase_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-secondary">
                                                {purchase.suppliers?.supplier_name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-secondary">
                                                {purchase.total_items || 0} items
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-text-primary">
                                                ₹{parseFloat(purchase.total_amount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="success">Completed</Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => navigate(`/purchases/${purchase.id}`)}
                                                        className="p-2 hover:bg-cyan-50 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={18} className="text-cyan" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePurchase(purchase.id)}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} className="text-red-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary */}
                <div className="mt-6 text-sm text-text-muted">
                    Showing {Array.isArray(purchases) ? purchases.length : 0} purchases
                </div>
            </div>
        </div>
    );
};

export default Purchases;
