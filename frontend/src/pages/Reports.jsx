import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, ShoppingCart, Users, DollarSign, AlertTriangle } from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import productService from '../services/product.service';
import saleService from '../services/sale.service';
import purchaseService from '../services/purchase.service';
import toast from 'react-hot-toast';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [metrics, setMetrics] = useState({
        totalSales: 0,
        totalPurchases: 0,
        totalProducts: 0,
        lowStockCount: 0,
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);

            const [productsRes, salesRes, purchasesRes] = await Promise.all([
                productService.getAll(),
                saleService.getAll(),
                purchaseService.getAll(),
            ]);

            const productsData = productsRes.success && productsRes.data?.products ? productsRes.data.products : [];
            const salesData = salesRes.success && (salesRes.data?.sales || salesRes.data?.bills) ? (salesRes.data.sales || salesRes.data.bills) : [];
            const purchasesData = purchasesRes.success && purchasesRes.data?.purchases ? purchasesRes.data.purchases : [];

            setProducts(productsData);
            setSales(salesData);
            setPurchases(purchasesData);

            // Calculate metrics
            const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
            const totalPurchases = purchasesData.reduce((sum, purchase) => sum + parseFloat(purchase.total_amount || 0), 0);
            const lowStockCount = productsData.filter(p => p.current_stock <= p.min_stock_level).length;

            setMetrics({
                totalSales,
                totalPurchases,
                totalProducts: productsData.length,
                lowStockCount,
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load reports data');
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data
    const stockStatusData = [
        { name: 'In Stock', value: products.filter(p => p.current_stock > p.min_stock_level).length, color: '#10B981' },
        { name: 'Low Stock', value: products.filter(p => p.current_stock <= p.min_stock_level && p.current_stock > 0).length, color: '#F59E0B' },
        { name: 'Out of Stock', value: products.filter(p => p.current_stock === 0).length, color: '#EF4444' },
    ];

    const topProducts = products
        .sort((a, b) => b.current_stock - a.current_stock)
        .slice(0, 5)
        .map(p => ({
            name: p.product_name.length > 15 ? p.product_name.slice(0, 15) + '...' : p.product_name,
            stock: p.current_stock,
        }));

    const salesTrendData = sales
        .slice(-7)
        .map(sale => ({
            date: new Date(sale.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount: parseFloat(sale.total_amount),
        }));

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
                <div className="mb-6">
                    <h1 className="text-3xl font-heading font-bold text-navy mb-2">Reports & Analytics</h1>
                    <p className="text-text-muted">Business insights and performance metrics</p>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-muted mb-1">Total Sales</p>
                                <p className="text-2xl font-bold text-text-primary">₹{metrics.totalSales.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg">
                                <DollarSign className="text-emerald-600" size={24} />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-muted mb-1">Total Purchases</p>
                                <p className="text-2xl font-bold text-text-primary">₹{metrics.totalPurchases.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-cyan-50 rounded-lg">
                                <ShoppingCart className="text-cyan" size={24} />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-muted mb-1">Total Products</p>
                                <p className="text-2xl font-bold text-text-primary">{metrics.totalProducts}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <Package className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-muted mb-1">Low Stock Alerts</p>
                                <p className="text-2xl font-bold text-text-primary">{metrics.lowStockCount}</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                                <AlertTriangle className="text-red-600" size={24} />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Sales Trend */}
                    <Card>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Sales Trend (Last 7 Days)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={salesTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="amount" stroke="#06B6D4" strokeWidth={2} name="Sales (₹)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Stock Status */}
                    <Card>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Stock Status Distribution</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={stockStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {stockStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Top Products by Stock */}
                    <Card>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Top 5 Products by Stock</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={topProducts}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="stock" fill="#06B6D4" name="Stock Quantity" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Summary Stats */}
                    <Card>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                <span className="text-sm text-text-secondary">Total Sales Transactions</span>
                                <span className="font-semibold text-text-primary">{sales.length}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                <span className="text-sm text-text-secondary">Total Purchase Orders</span>
                                <span className="font-semibold text-text-primary">{purchases.length}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                <span className="text-sm text-text-secondary">Average Sale Value</span>
                                <span className="font-semibold text-text-primary">
                                    ₹{sales.length > 0 ? (metrics.totalSales / sales.length).toFixed(2) : 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-text-secondary">Profit Margin</span>
                                <Badge variant="success">
                                    {metrics.totalSales > 0 ? ((metrics.totalSales - metrics.totalPurchases) / metrics.totalSales * 100).toFixed(1) : 0}%
                                </Badge>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Low Stock Products */}
                {metrics.lowStockCount > 0 && (
                    <Card>
                        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-red-600" size={20} />
                            Low Stock Products
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200 bg-bg-secondary">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Product</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">SKU</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Current Stock</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Min Level</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products
                                        .filter(p => p.current_stock <= p.min_stock_level)
                                        .map(product => (
                                            <tr key={product.id} className="border-b border-gray-200">
                                                <td className="px-4 py-3 text-sm text-text-primary">{product.product_name}</td>
                                                <td className="px-4 py-3 text-sm text-text-secondary">{product.sku}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-red-600">{product.current_stock}</td>
                                                <td className="px-4 py-3 text-sm text-text-secondary">{product.min_stock_level}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={product.current_stock === 0 ? 'danger' : 'warning'}>
                                                        {product.current_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Reports;
