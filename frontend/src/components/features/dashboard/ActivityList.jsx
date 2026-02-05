import React from 'react';
import { ShoppingCart, Package, TrendingUp, AlertCircle } from 'lucide-react';
import Badge from '../../common/Badge';

const ActivityList = ({ activities }) => {
    const getActivityIcon = (type) => {
        switch (type) {
            case 'sale':
                return <ShoppingCart size={18} className="text-cyan" />;
            case 'purchase':
                return <Package size={18} className="text-emerald" />;
            case 'stock':
                return <TrendingUp size={18} className="text-yellow-600" />;
            case 'alert':
                return <AlertCircle size={18} className="text-red-600" />;
            default:
                return <Package size={18} className="text-gray-600" />;
        }
    };

    const getActivityBadge = (type) => {
        const badges = {
            sale: { variant: 'info', text: 'Sale' },
            purchase: { variant: 'success', text: 'Purchase' },
            stock: { variant: 'warning', text: 'Stock' },
            alert: { variant: 'danger', text: 'Alert' },
        };
        return badges[type] || { variant: 'default', text: 'Activity' };
    };

    return (
        <div className="bg-white rounded-card shadow-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activities</h3>
            <div className="space-y-4">
                {activities.length === 0 ? (
                    <p className="text-text-muted text-center py-8">No recent activities</p>
                ) : (
                    activities.map((activity, index) => {
                        const badge = getActivityBadge(activity.type);
                        return (
                            <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                <div className="mt-1">{getActivityIcon(activity.type)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-text-primary">{activity.title}</p>
                                        <Badge variant={badge.variant} size="sm">{badge.text}</Badge>
                                    </div>
                                    <p className="text-xs text-text-muted">{activity.description}</p>
                                    <p className="text-xs text-text-muted mt-1">{activity.time}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ActivityList;
