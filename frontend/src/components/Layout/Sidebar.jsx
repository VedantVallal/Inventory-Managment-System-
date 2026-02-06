import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    ShoppingBag,
    Users,
    Truck,
    FileText,
    User,
    CreditCard
} from 'lucide-react';

const Sidebar = () => {
    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Products', path: '/products', icon: Package },
        { name: 'Sales', path: '/sales', icon: ShoppingCart },
        { name: 'Purchases', path: '/purchases', icon: ShoppingBag },
        { name: 'Customers', path: '/customers', icon: Users },
        { name: 'Suppliers', path: '/suppliers', icon: Truck },
        { name: 'POS Billing', path: '/pos', icon: CreditCard },
        { name: 'Reports', path: '/reports', icon: FileText },
        { name: 'My Profile', path: '/my-profile', icon: User },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-2xl font-heading font-bold text-navy">StockFlow</h1>
                <p className="text-xs text-text-muted mt-1">Inventory Management</p>
            </div>

            {/* Navigation */}
            <nav className="p-4">
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-cyan text-white'
                                        : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                                    }`
                                }
                            >
                                <item.icon size={20} />
                                <span className="font-medium">{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
