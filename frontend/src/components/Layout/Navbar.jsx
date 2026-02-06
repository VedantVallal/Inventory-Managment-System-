import React, { useState, useEffect, useRef } from 'react';
import { Bell, User, LogOut, Search as SearchIcon, X, Package, Users, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import alertService from '../../services/alert.service';
import productService from '../../services/product.service';
import customerService from '../../services/customer.service';
import saleService from '../../services/sale.service';



const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchRef = useRef(null);

    // Notification State
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch alerts on mount
    useEffect(() => {
        fetchAlerts();
        // Optional: Poll for new alerts every 60 seconds
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            // Fetch all alerts
            const allRes = await alertService.getAll();
            if (allRes && allRes.success && allRes.data && allRes.data.alerts) {
                const allAlerts = allRes.data.alerts;
                setAlerts(Array.isArray(allAlerts) ? allAlerts : []);
                setUnreadCount(Array.isArray(allAlerts) ? allAlerts.filter(a => !a.is_read).length : 0);
            } else {
                // Silently fail - alerts are not critical
                setAlerts([]);
                setUnreadCount(0);
            }
        } catch (error) {
            // Silently fail - don't show error toast for alerts
            console.error('Error fetching alerts:', error);
            setAlerts([]);
            setUnreadCount(0);
        }
    };

    const handleMarkAsRead = async (alertId) => {
        try {
            await alertService.markAsRead(alertId);
            setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking alert as read:', error);
        }
    };

    // Search Logic
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchQuery.trim().length > 1) {
                performSearch();
            } else {
                setSearchResults(null);
                setShowSearchDropdown(false);
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    const performSearch = async () => {
        setIsSearching(true);
        setShowSearchDropdown(true);
        try {
            const [productsRes, customersRes] = await Promise.all([
                productService.getAll({ search: searchQuery, limit: 3 }),
                customerService.getAll({ search: searchQuery }), // limit not supported in customer controller yet but small dataset likely
            ]);

            setSearchResults({
                products: productsRes.success ? productsRes.data.products.slice(0, 3) : [],
                customers: customersRes.success ? customersRes.data.customers.slice(0, 3) : [],
            });
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4 z-20 relative">
            <div className="flex items-center justify-between">
                {/* Search Bar */}
                <div className="flex-1 max-w-xl relative" ref={searchRef}>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchQuery.length > 1 && setShowSearchDropdown(true)}
                            placeholder="Search products, customers..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent transition-shadow"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showSearchDropdown && searchResults && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-96 overflow-y-auto">
                            {isSearching ? (
                                <div className="p-4 text-center text-text-muted">Searching...</div>
                            ) : (
                                <>
                                    {/* Products */}
                                    {searchResults.products?.length > 0 && (
                                        <div className="p-2">
                                            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-2">Products</div>
                                            {searchResults.products.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => navigate('/products')} // Ideally go to product detail but we might not have that page yet
                                                    className="flex items-center gap-3 p-2 hover:bg-bg-secondary rounded cursor-pointer group"
                                                >
                                                    <div className="w-8 h-8 rounded bg-cyan/10 flex items-center justify-center text-cyan">
                                                        <Package size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-text-primary group-hover:text-cyan transition-colors">{p.product_name}</p>
                                                        <p className="text-xs text-text-muted">SKU: {p.sku} • Stock: {p.current_stock}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Customers */}
                                    {searchResults.customers?.length > 0 && (
                                        <div className="p-2 border-t border-gray-100">
                                            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-2">Customers</div>
                                            {searchResults.customers.map(c => (
                                                <div
                                                    key={c.id}
                                                    onClick={() => navigate('/customers')}
                                                    className="flex items-center gap-3 p-2 hover:bg-bg-secondary rounded cursor-pointer group"
                                                >
                                                    <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center text-purple-600">
                                                        <Users size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-text-primary group-hover:text-purple-600 transition-colors">{c.customer_name}</p>
                                                        <p className="text-xs text-text-muted">{c.phone}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* No Results */}
                                    {searchResults.products?.length === 0 && searchResults.customers?.length === 0 && (
                                        <div className="p-8 text-center text-text-muted">
                                            <SearchIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p>No results found for "{searchQuery}"</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    {/* Notifications - Functional now */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 hover:bg-bg-secondary rounded-lg transition-colors relative"
                        >
                            <Bell size={20} className="text-text-secondary" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <h3 className="font-semibold text-text-primary">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button className="text-xs text-cyan hover:text-cyan-700 font-medium">
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {alerts.length > 0 ? (
                                        alerts.map(alert => (
                                            <div
                                                key={alert.id}
                                                className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!alert.is_read ? 'bg-cyan/5 border-l-2 border-l-cyan' : ''}`}
                                                onClick={() => !alert.is_read && handleMarkAsRead(alert.id)}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.alert_type === 'low_stock' ? 'bg-orange-100 text-orange-700' :
                                                        alert.alert_type === 'out_of_stock' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {alert.alert_type.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-[10px] text-text-muted">
                                                        {new Date(alert.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-text-primary">{alert.message}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center text-text-muted">
                                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No notifications</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-text-primary">{user?.full_name || 'User'}</p>
                            <p className="text-xs text-text-muted capitalize">{user?.role || 'Admin'}</p>
                        </div>
                        <div className="w-10 h-10 bg-cyan rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors ml-1"
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


