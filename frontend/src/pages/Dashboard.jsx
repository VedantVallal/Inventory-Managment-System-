import React, { useState, useEffect } from 'react';
import { Package, DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react';
import dashboardService from '../services/dashboard.service';
import MetricCard from '../components/features/dashboard/MetricCard';
import SalesChart from '../components/features/dashboard/SalesChart';
import ActivityList from '../components/features/dashboard/ActivityList';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [metrics, setMetrics] = useState({
        totalProducts: 0,
        totalStockValue: 0,
        todaySales: 0,
        lowStockAlerts: 0,
    });
    const [salesData, setSalesData] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all dashboard data in parallel with individual error handling
            const results = await Promise.allSettled([
                dashboardService.getMetrics().catch(err => {
                    console.error('Metrics API error:', err);
                    return { success: false, error: err };
                }),
                dashboardService.getSalesChart(7).catch(err => {
                    console.error('Sales chart API error:', err);
                    return { success: false, error: err };
                }),
                dashboardService.getRecentActivities().catch(err => {
                    console.error('Activities API error:', err);
                    return { success: false, error: err };
                }),
            ]);

            // Handle metrics
            if (results[0].status === 'fulfilled' && results[0].value?.success && results[0].value?.data) {
                setMetrics(results[0].value.data);
            } else {
                console.warn('Using default metrics due to API error');
            }

            // Handle sales chart
            if (results[1].status === 'fulfilled' && results[1].value?.success && results[1].value?.data) {
                setSalesData(Array.isArray(results[1].value.data) ? results[1].value.data : []);
            } else {
                console.warn('Using empty sales data due to API error');
                setSalesData([]);
            }

            // Handle activities
            if (results[2].status === 'fulfilled' && results[2].value?.success && results[2].value?.data) {
                setActivities(Array.isArray(results[2].value.data) ? results[2].value.data : []);
            } else {
                console.warn('Using empty activities due to API error');
                setActivities([]);
            }
        } catch (error) {
            console.error('Dashboard error:', error);
            setError(error.message || 'Failed to load dashboard');
            toast.error('Some dashboard data failed to load');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                    <p className="text-gray-600">Welcome back! Here's what's happening with your inventory.</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Total Products"
                        value={metrics?.totalProducts || 0}
                        icon={Package}
                        color="cyan"
                    />
                    <MetricCard
                        title="Stock Value"
                        value={`₹${(metrics?.totalStockValue || 0).toLocaleString()}`}
                        icon={DollarSign}
                        color="emerald"
                    />
                    <MetricCard
                        title="Today's Sales"
                        value={`₹${(metrics?.todaySales || 0).toLocaleString()}`}
                        icon={ShoppingCart}
                        color="cyan"
                    />
                    <MetricCard
                        title="Low Stock Alerts"
                        value={metrics?.lowStockAlerts || 0}
                        icon={AlertTriangle}
                        color={(metrics?.lowStockAlerts || 0) > 0 ? 'red' : 'emerald'}
                    />
                </div>

                {/* Charts and Activities */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <SalesChart data={salesData || []} />
                    </div>
                    <div>
                        <ActivityList activities={activities || []} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
