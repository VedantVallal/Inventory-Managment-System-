import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, trend, trendValue, color = 'cyan' }) => {
    const colorClasses = {
        cyan: 'bg-cyan-50 text-cyan-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <div className="bg-white rounded-card shadow-card p-6 hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {trendValue}
                    </div>
                )}
            </div>
            <h3 className="text-text-muted text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-text-primary break-words" title={value}>{value}</p>
        </div>
    );
};

export default MetricCard;
