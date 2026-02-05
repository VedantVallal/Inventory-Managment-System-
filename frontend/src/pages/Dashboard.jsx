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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all dashboard data in parallel
            const [metricsRes, chartRes, activitiesRes] = await Promise.all([
                dashboardService.getMetrics(),
                dashboardService.getSalesChart(7),
                dashboardService.getRecentActivities(),
            ]);

            if (metricsRes.success) {
                setMetrics(metricsRes.data);
            }

            if (chartRes.success) {
                setSalesData(chartRes.data);
            }

            if (activitiesRes.success) {
                setActivities(activitiesRes.data);
            }
        } catch (error) {
            console.error('Dashboard error:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-bold text-navy mb-2">Dashboard</h1>
                    <p className="text-text-muted">Welcome back! Here's what's happening with your inventory.</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Total Products"
                        value={metrics.totalProducts}
                        icon={Package}
                        color="cyan"
                    />
                    <MetricCard
                        title="Stock Value"
                        value={`₹${metrics.totalStockValue?.toLocaleString() || 0}`}
                        icon={DollarSign}
                        color="emerald"
                    />
                    <MetricCard
                        title="Today's Sales"
                        value={`₹${metrics.todaySales?.toLocaleString() || 0}`}
                        icon={ShoppingCart}
                        color="cyan"
                    />
                    <MetricCard
                        title="Low Stock Alerts"
                        value={metrics.lowStockAlerts}
                        icon={AlertTriangle}
                        color={metrics.lowStockAlerts > 0 ? 'red' : 'emerald'}
                    />
                </div>

                {/* Charts and Activities */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <SalesChart data={salesData} />
                    </div>
                    <div>
                        <ActivityList activities={activities} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
