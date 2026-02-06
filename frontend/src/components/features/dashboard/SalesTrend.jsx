import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../../utils/currency';

const SalesTrend = ({ data }) => {
    // Calculate peak and low days
    const validData = Array.isArray(data) ? data : [];

    let peakDay = { date: '-', sales: 0 };
    let lowDay = { date: '-', sales: Infinity };

    if (validData.length > 0) {
        peakDay = validData.reduce((max, obj) => (obj.sales > max.sales ? obj : max), validData[0]);
        lowDay = validData.reduce((min, obj) => (obj.sales < min.sales ? obj : min), validData[0]);
    }

    // Safety check if lowDay is still Infinity (e.g. all sales 0)
    if (lowDay.sales === Infinity) lowDay = { date: '-', sales: 0 };

    return (
        <div className="bg-white rounded-card shadow-card p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Sales Trend</h3>
                <div className="flex gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-xs font-medium text-text-secondary rounded">7 Days</span>
                    <span className="px-2 py-1 text-xs font-medium text-text-muted cursor-pointer hover:text-cyan-600">30 Days</span>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-medium uppercase">Peak Day</p>
                    <p className="font-bold text-emerald-800 text-sm mt-1">{peakDay.date}</p>
                    <p className="text-xs text-emerald-700">{formatCurrency(peakDay.sales)}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-xs text-red-600 font-medium uppercase">Slowest Day</p>
                    <p className="font-bold text-red-800 text-sm mt-1">{lowDay.date}</p>
                    <p className="text-xs text-red-700">{formatCurrency(lowDay.sales)}</p>
                </div>
            </div>

            <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={validData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#94A3B8"
                            style={{ fontSize: '10px' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                // Format date to show only Day (e.g. "Mon") or "DD/MM"
                                const date = new Date(value);
                                return isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { weekday: 'short' });
                            }}
                        />
                        <YAxis
                            stroke="#94A3B8"
                            style={{ fontSize: '10px' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px'
                            }}
                            formatter={(value) => [formatCurrency(value), 'Sales']}
                            labelStyle={{ color: '#64748B', marginBottom: '4px' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="sales"
                            stroke="#06B6D4" // Cyan-500
                            strokeWidth={3}
                            dot={{ fill: '#06B6D4', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SalesTrend;
