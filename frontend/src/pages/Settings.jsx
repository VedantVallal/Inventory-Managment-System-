import React, { useState, useEffect } from 'react';
import { Building, User, Lock, Settings as SettingsIcon } from 'lucide-react';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('business');
    const [loading, setLoading] = useState(false);

    const [businessData, setBusinessData] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        address: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        fetchBusinessProfile();
    }, []);

    const fetchBusinessProfile = async () => {
        try {
            const response = await api.get('/settings/business');
            if (response.data.success && response.data.data.business) {
                const business = response.data.data.business;
                setBusinessData({
                    businessName: business.business_name || '',
                    ownerName: business.owner_name || '',
                    email: business.email || '',
                    phone: business.phone || '',
                    address: business.address || '',
                });
            }
        } catch (error) {
            console.error('Error fetching business settings:', error);
            // Fallback to user context if API fails, though API should work
            if (user) {
                setBusinessData(prev => ({
                    ...prev,
                    businessName: user.businessName || prev.businessName,
                    email: user.email || prev.email,
                }));
            }
        }
    };

    const handleUpdateBusiness = async () => {
        try {
            setLoading(true);

            const response = await api.put('/settings/business', {
                businessName: businessData.businessName,
                ownerName: businessData.ownerName,
                phone: businessData.phone,
                address: businessData.address,
            });

            if (response.data.success) {
                toast.success('Business profile updated successfully');
            }
        } catch (error) {
            console.error('Error updating business:', error);
            toast.error(error.response?.data?.message || 'Failed to update business profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);

            const response = await api.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });

            if (response.data.success) {
                toast.success('Password changed successfully');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'business', label: 'Business Profile', icon: Building },
        { id: 'password', label: 'Change Password', icon: Lock },
        { id: 'about', label: 'About', icon: SettingsIcon },
    ];

    return (
        <div className="p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-heading font-bold text-navy mb-2">Settings</h1>
                    <p className="text-text-muted">Manage your account and application settings</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1">
                        <Card>
                            <nav className="space-y-1">
                                {tabs.map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id
                                                ? 'bg-cyan text-white'
                                                : 'text-text-secondary hover:bg-bg-primary'
                                                }`}
                                        >
                                            <Icon size={20} />
                                            <span className="font-medium">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </Card>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        {/* Business Profile Tab */}
                        {activeTab === 'business' && (
                            <Card>
                                <h3 className="text-xl font-semibold text-text-primary mb-6">Business Profile</h3>
                                <div className="space-y-4">
                                    <Input
                                        label="Business Name"
                                        type="text"
                                        value={businessData.businessName}
                                        onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                                        placeholder="Enter business name"
                                    />

                                    <Input
                                        label="Owner Name"
                                        type="text"
                                        value={businessData.ownerName}
                                        onChange={(e) => setBusinessData({ ...businessData, ownerName: e.target.value })}
                                        placeholder="Enter owner name"
                                    />

                                    <Input
                                        label="Email"
                                        type="email"
                                        value={businessData.email}
                                        disabled
                                        placeholder="Email cannot be changed"
                                    />

                                    <Input
                                        label="Phone"
                                        type="tel"
                                        value={businessData.phone}
                                        onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                                        placeholder="Enter phone number"
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            Address
                                        </label>
                                        <textarea
                                            value={businessData.address}
                                            onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                                            placeholder="Enter business address"
                                            rows="3"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            variant="primary"
                                            onClick={handleUpdateBusiness}
                                            loading={loading}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Change Password Tab */}
                        {activeTab === 'password' && (
                            <Card>
                                <h3 className="text-xl font-semibold text-text-primary mb-6">Change Password</h3>
                                <div className="space-y-4">
                                    <Input
                                        label="Current Password"
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        placeholder="Enter current password"
                                    />

                                    <Input
                                        label="New Password"
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        placeholder="Enter new password"
                                    />

                                    <Input
                                        label="Confirm New Password"
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        placeholder="Confirm new password"
                                    />

                                    <div className="pt-4">
                                        <Button
                                            variant="primary"
                                            onClick={handleChangePassword}
                                            loading={loading}
                                            disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                        >
                                            Change Password
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* About Tab */}
                        {activeTab === 'about' && (
                            <Card>
                                <h3 className="text-xl font-semibold text-text-primary mb-6">About StockFlow</h3>
                                <div className="space-y-4">
                                    <div className="pb-4 border-b border-gray-200">
                                        <p className="text-sm text-text-muted mb-1">Application Name</p>
                                        <p className="text-lg font-semibold text-text-primary">StockFlow Inventory Management System</p>
                                    </div>

                                    <div className="pb-4 border-b border-gray-200">
                                        <p className="text-sm text-text-muted mb-1">Version</p>
                                        <p className="text-lg font-semibold text-text-primary">1.0.0</p>
                                    </div>

                                    <div className="pb-4 border-b border-gray-200">
                                        <p className="text-sm text-text-muted mb-1">Description</p>
                                        <p className="text-text-secondary">
                                            A comprehensive inventory management system designed to help businesses manage products,
                                            sales, purchases, customers, and suppliers efficiently.
                                        </p>
                                    </div>

                                    <div className="pb-4 border-b border-gray-200">
                                        <p className="text-sm text-text-muted mb-1">Features</p>
                                        <ul className="list-disc list-inside text-text-secondary space-y-1">
                                            <li>Product Management</li>
                                            <li>Sales & Billing</li>
                                            <li>Purchase Orders</li>
                                            <li>Customer & Supplier Management</li>
                                            <li>Reports & Analytics</li>
                                            <li>Real-time Stock Tracking</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="text-sm text-text-muted mb-1">Support</p>
                                        <p className="text-text-secondary">
                                            For support and inquiries, please contact: <br />
                                            <a href="mailto:support@stockflow.com" className="text-cyan hover:underline">
                                                support@stockflow.com
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
