import React, { useState, useEffect } from 'react';
import { User, Building, Mail, Phone, MapPin, Calendar, Shield, Edit2, X, Save } from 'lucide-react';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const MyProfile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [profileData, setProfileData] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        address: '',
        gst: '',
        registrationDate: '',
        role: ''
    });
    const [editData, setEditData] = useState({});

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);

            // Fetch business profile from settings endpoint
            const response = await api.get('/settings/business');

            // Note: axios interceptor returns response.data, so response = {success, data: {business}}

            if (response?.success && response?.data?.business) {
                const business = response.data.business;
                const data = {
                    businessName: business.business_name || 'N/A',
                    ownerName: business.owner_name || user?.fullName || 'N/A',
                    email: business.email || user?.email || 'N/A',
                    phone: business.phone || 'N/A',
                    address: business.address || 'N/A',
                    gst: business.gst_number || 'Not Provided',
                    registrationDate: business.created_at ? new Date(business.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    }) : 'N/A',
                    role: user?.role || 'Admin'
                };
                setProfileData(data);
                setEditData(data);
            } else {
                // Fallback to user context if API fails
                const data = {
                    businessName: user?.businessName || 'N/A',
                    ownerName: user?.fullName || 'N/A',
                    email: user?.email || 'N/A',
                    phone: 'N/A',
                    address: 'N/A',
                    gst: 'Not Provided',
                    registrationDate: 'N/A',
                    role: user?.role || 'Admin'
                };
                setProfileData(data);
                setEditData(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);

            // Fallback to user context
            const data = {
                businessName: user?.businessName || 'N/A',
                ownerName: user?.fullName || 'N/A',
                email: user?.email || 'N/A',
                phone: 'N/A',
                address: 'N/A',
                gst: 'Not Provided',
                registrationDate: 'N/A',
                role: user?.role || 'Admin'
            };
            setProfileData(data);
            setEditData(data);

            toast.error('Failed to load complete profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditMode(true);
        setEditData({ ...profileData });
    };

    const handleCancel = () => {
        setIsEditMode(false);
        setEditData({ ...profileData });
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Validate phone number (10 digits) - only if provided
            if (editData.phone && editData.phone !== 'N/A' && editData.phone.trim() !== '') {
                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(editData.phone)) {
                    toast.error('Phone number must be exactly 10 digits');
                    setSaving(false);
                    return;
                }
            }

            const requestPayload = {
                businessName: editData.businessName,
                ownerName: editData.ownerName,
                phone: (editData.phone === 'N/A' || !editData.phone) ? '' : editData.phone,
                address: (editData.address === 'N/A' || !editData.address) ? '' : editData.address,
                gstNumber: (editData.gst === 'Not Provided' || !editData.gst) ? '' : editData.gst,
            };

            const response = await api.put('/settings/business', requestPayload);

            // Note: axios interceptor returns response.data, so response = {success, message, data}

            // Check if response indicates success
            if (response && response.success) {
                // Update the displayed data immediately
                setProfileData({ ...editData });
                setIsEditMode(false);
                toast.success('Profile updated successfully!');

                // Refresh data from server to ensure consistency
                await fetchProfileData();
            } else {
                toast.error('Unexpected response from server');
            }
        } catch (error) {
            console.error('Error updating profile:', error);

            const errorMessage = error.response?.data?.message
                || error.message
                || 'Failed to update profile';

            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header with Edit Button */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-navy mb-2">My Profile</h1>
                        <p className="text-text-muted">Your business and account information</p>
                    </div>
                    <div>
                        {!isEditMode ? (
                            <Button
                                variant="primary"
                                onClick={handleEdit}
                                className="flex items-center gap-2"
                            >
                                <Edit2 size={18} />
                                Edit Profile
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={handleCancel}
                                    className="flex items-center gap-2"
                                >
                                    <X size={18} />
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                    loading={saving}
                                    className="flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Card */}
                <Card>
                    <div className="p-6">
                        {/* Profile Header with Avatar */}
                        <div className="flex items-center gap-6 pb-6 border-b border-gray-200 mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-cyan to-blue-600 rounded-full flex items-center justify-center">
                                <User size={40} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary">{isEditMode ? editData.ownerName : profileData.ownerName}</h2>
                                <p className="text-text-muted">{profileData.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Shield size={16} className="text-cyan" />
                                    <span className="text-sm font-medium text-cyan">{profileData.role}</span>
                                </div>
                            </div>
                        </div>

                        {/* Business Information */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <Building size={20} className="text-cyan" />
                                Business Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Business Name */}
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2">
                                        Business Name
                                    </label>
                                    {isEditMode ? (
                                        <Input
                                            type="text"
                                            value={editData.businessName}
                                            onChange={(e) => setEditData({ ...editData, businessName: e.target.value })}
                                            placeholder="Enter business name"
                                        />
                                    ) : (
                                        <p className="text-base text-text-primary font-medium">
                                            {profileData.businessName}
                                        </p>
                                    )}
                                </div>

                                {/* Owner Name */}
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2">
                                        Owner Name
                                    </label>
                                    {isEditMode ? (
                                        <Input
                                            type="text"
                                            value={editData.ownerName}
                                            onChange={(e) => setEditData({ ...editData, ownerName: e.target.value })}
                                            placeholder="Enter owner name"
                                        />
                                    ) : (
                                        <p className="text-base text-text-primary font-medium">
                                            {profileData.ownerName}
                                        </p>
                                    )}
                                </div>

                                {/* Email (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                                        <Mail size={14} />
                                        Email Address
                                    </label>
                                    <p className="text-base text-text-primary font-medium">
                                        {profileData.email}
                                    </p>
                                    {isEditMode && (
                                        <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
                                    )}
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                                        <Phone size={14} />
                                        Phone Number
                                    </label>
                                    {isEditMode ? (
                                        <Input
                                            type="tel"
                                            value={editData.phone === 'N/A' ? '' : editData.phone}
                                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                            placeholder="Enter 10-digit phone number"
                                            maxLength={10}
                                        />
                                    ) : (
                                        <p className="text-base text-text-primary font-medium">
                                            {profileData.phone}
                                        </p>
                                    )}
                                </div>

                                {/* Business Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                                        <MapPin size={14} />
                                        Business Address
                                    </label>
                                    {isEditMode ? (
                                        <textarea
                                            value={editData.address === 'N/A' ? '' : editData.address}
                                            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            placeholder="Enter business address"
                                            rows="3"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
                                        />
                                    ) : (
                                        <p className="text-base text-text-primary font-medium">
                                            {profileData.address}
                                        </p>
                                    )}
                                </div>

                                {/* GST Number */}
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2">
                                        GST Number
                                    </label>
                                    {isEditMode ? (
                                        <Input
                                            type="text"
                                            value={editData.gst === 'Not Provided' ? '' : editData.gst}
                                            onChange={(e) => setEditData({ ...editData, gst: e.target.value })}
                                            placeholder="Enter GST number (optional)"
                                        />
                                    ) : (
                                        <p className="text-base text-text-primary font-medium">
                                            {profileData.gst}
                                        </p>
                                    )}
                                </div>

                                {/* Registration Date (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                                        <Calendar size={14} />
                                        Registration Date
                                    </label>
                                    <p className="text-base text-text-primary font-medium">
                                        {profileData.registrationDate}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* System Information */}
                        <div className="pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-text-primary mb-4">
                                System Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-text-muted mb-1">Application</p>
                                    <p className="text-base font-semibold text-text-primary">StockFlow IMS</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-text-muted mb-1">Version</p>
                                    <p className="text-base font-semibold text-text-primary">1.0.0</p>
                                </div>
                            </div>
                        </div>

                        {/* Note */}
                        {!isEditMode && (
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> Click the "Edit Profile" button above to update your business information.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default MyProfile;
