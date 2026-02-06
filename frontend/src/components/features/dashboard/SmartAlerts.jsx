import React from 'react';
import { AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import Badge from '../../common/Badge';

const SmartAlerts = ({ metrics }) => {
    // Generate alerts based on metrics
    const lowStockCount = metrics?.lowStockAlerts || 0;
    const outOfStockCount = metrics?.outOfStockCount || 0;

    // Tips logic (would be more dynamic in a real app)
    const getTip = () => {
        const day = new Date().getDay();
        if (day === 1) return { text: "Monday is usually your busiest day. Ensure fast movers are stocked up!", icon: TrendingUp };
        if (day === 5) return { text: "Prepare for the weekend rush. Check your inventory levels.", icon: TrendingUp };
        return { text: "Review your dead stock to free up cash flow.", icon: Lightbulb };
    };

    const tip = getTip();
    const TipIcon = tip.icon;

    if (lowStockCount === 0 && outOfStockCount === 0) {
        return (
            <div className="bg-white rounded-card shadow-card p-6 border-l-4 border-emerald-500">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-50 rounded-full">
                        <TipIcon size={24} className="text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-1">Everything looks good!</h3>
                        <p className="text-text-muted text-sm">You have no urgent alerts. {tip.text}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-card shadow-card p-6 h-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-500" />
                Needs Attention
            </h3>

            <div className="space-y-4">
                {outOfStockCount > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex items-start gap-3">
                        <div className="mt-1">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-red-800 text-sm">
                                {outOfStockCount} products are out of stock
                            </p>
                            <p className="text-red-600 text-xs mt-1">
                                You are losing potential sales. Reorder immediately.
                            </p>
                            <button className="mt-2 text-xs font-semibold text-red-700 hover:text-red-800 underline">
                                View Out of Stock Items →
                            </button>
                        </div>
                    </div>
                )}

                {lowStockCount > 0 && (
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 flex items-start gap-3">
                        <div className="mt-1">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-orange-800 text-sm">
                                {lowStockCount} products are running low
                            </p>
                            <p className="text-orange-600 text-xs mt-1">
                                Restock soon to avoid running out.
                            </p>
                            <button className="mt-2 text-xs font-semibold text-orange-700 hover:text-orange-800 underline">
                                View Low Stock Items →
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-3">
                        <Lightbulb size={18} className="text-blue-500 shrink-0" />
                        <p className="text-xs text-text-muted">
                            <span className="font-semibold text-blue-600">Tip:</span> {tip.text}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartAlerts;
