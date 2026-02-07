import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import alertService from '../../services/alert.service';


const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();



    // Notification State
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {

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

    const handleMarkAllRead = async () => {
        try {
            // Optimistically update UI
            setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
            setUnreadCount(0);

            // Call API for each unread alert
            const unreadAlerts = alerts.filter(a => !a.is_read);
            await Promise.all(unreadAlerts.map(a => alertService.markAsRead(a.id)));
        } catch (error) {
            console.error('Error marking all as read:', error);
            fetchAlerts(); // Revert on error
        }
    };



    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4 z-20 relative">
            <div className="flex items-center justify-between">
                <div className="flex-1"></div>

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
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs text-cyan hover:text-cyan-700 font-medium"
                                        >
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
                        <button
                            onClick={() => navigate('/my-profile')}
                            className="w-10 h-10 bg-cyan rounded-full flex items-center justify-center text-white font-semibold shadow-sm hover:bg-cyan-600 transition-colors cursor-pointer"
                            title="View Profile"
                        >
                            {user?.full_name?.charAt(0) || 'U'}
                        </button>
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


