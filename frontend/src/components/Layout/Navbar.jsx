import React from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Search - Placeholder for now */}
                <div className="flex-1 max-w-xl">
                    <input
                        type="text"
                        placeholder="Search products, customers, invoices..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
                    />
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <button className="p-2 hover:bg-bg-secondary rounded-lg transition-colors relative">
                        <Bell size={20} className="text-text-secondary" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="text-right">
                            <p className="text-sm font-medium text-text-primary">{user?.full_name || 'User'}</p>
                            <p className="text-xs text-text-muted">{user?.role || 'Admin'}</p>
                        </div>
                        <div className="w-10 h-10 bg-cyan rounded-full flex items-center justify-center text-white font-semibold">
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut size={18} className="text-red-600" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
