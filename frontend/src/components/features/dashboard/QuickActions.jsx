import React from 'react';
import { Plus, ShoppingCart, Barcode, FileText, Package, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
    const navigate = useNavigate();

    const actions = [
        {
            title: 'New Bill',
            icon: Plus,
            path: '/pos',
            color: 'cyan',
            description: 'Create invoice',
            primary: true
        },
        {
            title: 'Add Product',
            icon: Package,
            path: '/products',
            color: 'emerald',
            description: 'Update stock'
        },
        {
            title: 'View Reports',
            icon: TrendingUp,
            path: '/reports',
            color: 'blue',
            description: 'Check trends'
        }
    ];

    return (
        <div className="bg-white rounded-card shadow-card p-6 mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={index}
                            onClick={() => navigate(action.path)}
                            className={`
                                flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200
                                ${action.primary
                                    ? 'border-cyan-100 bg-cyan-50 hover:bg-cyan-100 hover:border-cyan-300'
                                    : 'border-transparent bg-gray-50 hover:bg-white hover:shadow-md hover:border-gray-200'}
                            `}
                        >
                            <div className={`p-4 rounded-full mb-3 ${action.primary ? 'bg-cyan-200 text-cyan-800' : 'bg-white text-text-secondary shadow-sm'}`}>
                                <Icon size={28} className={action.primary ? 'text-cyan-700' : `text-${action.color}-600`} />
                            </div>
                            <span className="font-semibold text-text-primary mb-1">{action.title}</span>
                            <span className="text-xs text-text-muted">{action.description}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickActions;
