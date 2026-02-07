import React from 'react';
import { TrendingUp, IndianRupee, FileText, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

const MetricCard = ({ title, value, subtext, trend, icon: Icon, color, isAlert }) => (
    <div className={`bg-white rounded-card shadow-card p-6 border-l-4 ${isAlert ? 'border-red-500' : `border-${color}-500`}`}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-text-secondary text-sm font-medium mb-1">{title}</h3>
                <div className="text-2xl font-bold text-navy">{value}</div>
            </div>
            <div className={`p-3 rounded-full bg-${color}-50`}>
                <Icon size={24} className={`text-${color}-600`} />
            </div>
        </div>

        {(subtext || trend) && (
            <div className="flex items-center text-sm">
                {trend && (
                    <span className={`flex items-center font-medium mr-2 ${trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {Math.abs(trend)}%
                    </span>
                )}
                <span className="text-text-muted">{subtext}</span>
            </div>
        )}
    </div>
);

const DashboardHero = ({ metrics }) => {
    // Determine detailed stock status
    const lowStockCount = metrics?.lowStockAlerts || 0;
    const isUrgent = lowStockCount > 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Today's Sales */}
            <MetricCard
                title="Today's Sales"
                value={formatCurrency(metrics?.todaySales || 0)}
                icon={TrendingUp}
                color="cyan"
                trend={12} // Placeholder for now, needs backend support
                subtext="from yesterday"
            />

            {/* Today's Profit - Using placeholder logic until backend update */}
            <MetricCard
                title="Today's Profit"
                value={formatCurrency(metrics?.todayProfit || 0)}
                icon={IndianRupee}
                color="emerald"
                trend={8} // Placeholder
                subtext="Healthy margin"
            />

            {/* Bills Today */}
            <MetricCard
                title="Bills Today"
                value={metrics?.todaysSalesCount || 0}
                icon={FileText}
                color="blue"
                subtext={metrics?.todaysSalesCount > 5 ? "Busy day!" : "Quiet day"}
            />

            {/* Stock Alerts */}
            <MetricCard
                title="Stock Alerts"
                value={`${lowStockCount} Items`}
                icon={AlertTriangle}
                color={isUrgent ? "red" : "emerald"}
                isAlert={isUrgent}
                subtext={isUrgent ? "Running low, reorder now" : "All clear, good job!"}
            />
        </div>
    );
};

export default DashboardHero;
