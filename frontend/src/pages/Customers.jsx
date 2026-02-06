import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Phone, Mail, Users } from 'lucide-react';
import customerService from '../services/customer.service';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        email: '',
        address: '',
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await customerService.getAll();
            if (response.success && response.data && Array.isArray(response.data.customers)) {
                setCustomers(response.data.customers);
            } else {
                setCustomers([]);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            setCustomers([]);
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = () => {
        setSelectedCustomer(null);
        setFormData({ customerName: '', phone: '', email: '', address: '' });
        setIsModalOpen(true);
    };

    const handleEditCustomer = (customer) => {
        setSelectedCustomer(customer);
        setFormData({
            customerName: customer.customer_name,
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
        });
        setIsModalOpen(true);
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            toast.error('Phone number must be exactly 10 digits');
            return false;
        }
        return true;
    };

    const handleSaveCustomer = async () => {
        if (!formData.customerName || !formData.phone) {
            toast.error('Customer name and phone are required');
            return;
        }

        // Validate phone number
        if (!validatePhone(formData.phone)) {
            return;
        }

        try {
            const customerData = {
                customerName: formData.customerName,
                phone: formData.phone,
                email: formData.email || null,
                address: formData.address || null,
            };

            if (selectedCustomer) {
                await customerService.update(selectedCustomer.id, customerData);
                toast.success('Customer updated successfully');
            } else {
                await customerService.create(customerData);
                toast.success('Customer created successfully');
            }

            setIsModalOpen(false);
            fetchCustomers();
        } catch (error) {
            console.error('Error saving customer:', error);
            toast.error(error.response?.data?.message || 'Failed to save customer');
        }
    };

    const handleDeleteCustomer = async (customerId) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) {
            return;
        }

        try {
            await customerService.delete(customerId);
            toast.success('Customer deleted successfully');
            fetchCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
            toast.error('Failed to delete customer');
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
        <>
            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-heading font-bold text-navy mb-2">Customers</h1>
                            <p className="text-text-muted">Manage your customer database</p>
                        </div>
                        <Button variant="primary" icon={Plus} onClick={handleAddCustomer}>
                            Add Customer
                        </Button>
                    </div>

                    {/* Customers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customers.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-card shadow-card text-center">
                                <div className="bg-cyan-50 p-4 rounded-full mb-4">
                                    <Users size={32} className="text-cyan" />
                                </div>
                                <h3 className="text-lg font-semibold text-navy mb-2">No Customers Found</h3>
                                <p className="text-text-muted mb-6 max-w-sm">
                                    Get started by adding your first customer to the system.
                                </p>
                                <Button variant="primary" icon={Plus} onClick={handleAddCustomer}>
                                    Add Customer
                                </Button>
                            </div>
                        ) : (
                            customers.map((customer) => (
                                <Card key={customer.id}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-text-primary">
                                                {customer.customer_name}
                                            </h3>
                                            <p className="text-sm text-text-muted">ID: {customer.id.slice(0, 8)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditCustomer(customer)}
                                                className="p-2 hover:bg-cyan-50 rounded-lg transition-colors"
                                            >
                                                <Edit size={16} className="text-cyan" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCustomer(customer.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} className="text-red-600" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {customer.phone && (
                                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                <Phone size={16} />
                                                <span>{customer.phone}</span>
                                            </div>
                                        )}
                                        {customer.email && (
                                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                <Mail size={16} />
                                                <span>{customer.email}</span>
                                            </div>
                                        )}
                                        {customer.address && (
                                            <p className="text-sm text-text-muted mt-2">{customer.address}</p>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Customer Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
            >
                <div className="space-y-4">
                    <Input
                        label="Customer Name *"
                        type="text"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder="Enter customer name"
                    />

                    <Input
                        label="Phone *"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter phone number"
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email address"
                    />

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Address
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Enter address"
                            rows="3"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSaveCustomer} className="flex-1">
                            {selectedCustomer ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Customers;
