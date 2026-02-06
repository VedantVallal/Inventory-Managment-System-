import React from 'react';
import { CheckCircle, AlertCircle, XCircle, TrendingUp } from 'lucide-react';
import Badge from '../../common/Badge';

const InventoryHealth = ({ metrics, fastMovingItems = [] }) => {
    // Extract stats from metrics
    const totalProducts = metrics?.totalProducts || 0;
    const lowStock = metrics?.lowStockAlerts || 0;
    const outOfStock = metrics?.outOfStockCount || 0;

    // Calculate In Stock (Total - Low - Out)
    const inStock = Math.max(0, totalProducts - lowStock - outOfStock);

    // Calculate percentages
    const inStockPercent = totalProducts > 0 ? Math.round((inStock / totalProducts) * 100) : 0;
    const lowStockPercent = totalProducts > 0 ? Math.round((lowStock / totalProducts) * 100) : 0;
    const outOfStockPercent = totalProducts > 0 ? Math.round((outOfStock / totalProducts) * 100) : 0;

    return (
        <div className="bg-white rounded-card shadow-card p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Inventory Health</h3>
                <Badge variant="info">Total: {totalProducts}</Badge>
            </div>

            <div className="space-y-6">
                {/* In Stock */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-text-primary font-medium">
                            <CheckCircle size={16} className="text-emerald-500" />
                            In Stock
                        </span>
                        <span className="text-text-muted">{inStock} products ({inStockPercent}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${inStockPercent}%` }}></div>
                    </div>
                </div>

                {/* Low Stock */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-text-primary font-medium">
                            <AlertCircle size={16} className="text-yellow-500" />
                            Running Low
                        </span>
                        <span className="text-text-muted">{lowStock} products ({lowStockPercent}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${lowStockPercent}%` }}></div>
                    </div>
                </div>

                {/* Out of Stock */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-text-primary font-medium">
                            <XCircle size={16} className="text-red-500" />
                            Out of Stock
                        </span>
                        <span className="text-text-muted">{outOfStock} products ({outOfStockPercent}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${outOfStockPercent}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-cyan-600" />
                    Fast Moving Items (Top 3)
                </h4>
                <div className="space-y-3">
                    {fastMovingItems.map((product, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                    {index + 1}
                                </div>
                                <span className="text-text-primary truncate max-w-[150px]">{product.product_name || product.name}</span>
                            </div>
                            <span className="text-text-muted">{product.sales_count || 0} sold</span>
                        </div>
                    ))}
                    {fastMovingItems.length === 0 && (
                        <p className="text-xs text-text-muted italic">No sales data yet</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryHealth;
