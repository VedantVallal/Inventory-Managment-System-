import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Building, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import toast from 'react-hot-toast';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {


            // Prepare data for backend API
            const userData = {
                businessName: formData.businessName,
                ownerName: formData.ownerName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                password: formData.password,
            };

            await register(userData);
            toast.success('Registration successful! Redirecting to dashboard...');
            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.response?.data?.message || error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-primary to-bg-secondary px-4 py-8">
            <div className="w-full max-w-2xl">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-heading font-bold text-navy mb-2">StockFlow</h1>
                    <p className="text-text-muted">Create your inventory management account</p>
                </div>

                {/* Registration Card */}
                <Card className="shadow-2xl">
                    <h2 className="text-2xl font-semibold text-text-primary mb-6 text-center">
                        Sign Up
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Business Details */}
                        <div className="border-b border-gray-200 pb-4 mb-4">
                            <h3 className="text-sm font-semibold text-text-primary mb-3">Business Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Business Name"
                                    type="text"
                                    name="businessName"
                                    placeholder="ABC Store"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    icon={Building}
                                    required
                                />
                                <Input
                                    label="Phone Number"
                                    type="tel"
                                    name="phone"
                                    placeholder="+91 9876543210"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    icon={Phone}
                                    required
                                />
                            </div>
                            <Input
                                label="Business Address"
                                type="text"
                                name="address"
                                placeholder="123 Main Street, City"
                                value={formData.address}
                                onChange={handleChange}
                                icon={MapPin}
                                required
                                className="mt-4"
                            />
                        </div>

                        {/* Owner Details */}
                        <div className="border-b border-gray-200 pb-4 mb-4">
                            <h3 className="text-sm font-semibold text-text-primary mb-3">Owner Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Full Name"
                                    type="text"
                                    name="ownerName"
                                    placeholder="John Doe"
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    icon={User}
                                    required
                                />
                                <Input
                                    label="Email Address"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    icon={Mail}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <h3 className="text-sm font-semibold text-text-primary mb-3">Security</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Password"
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    icon={Lock}
                                    required
                                    helperText="At least 6 characters"
                                />
                                <Input
                                    label="Confirm Password"
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    icon={Lock}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            loading={loading}
                        >
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-text-muted">
                            Already have an account?{' '}
                            <Link to="/login" className="text-cyan hover:text-cyan-dark font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </Card>

                {/* Footer */}
                <p className="text-center text-text-muted text-sm mt-8">
                    © 2024 StockFlow. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Register;
