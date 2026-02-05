import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import supplierService from '../services/supplier.service';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [formData, setFormData] = useState({
        supplierName: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await supplierService.getAll();
            if (response.success && response.data && Array.isArray(response.data.suppliers)) {
                setSuppliers(response.data.suppliers);
            } else {
                setSuppliers([]);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            setSuppliers([]);
            toast.error('Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSupplier = () => {
        setSelectedSupplier(null);
        setFormData({ supplierName: '', contactPerson: '', phone: '', email: '', address: '' });
        setIsModalOpen(true);
    };

    const handleEditSupplier = (supplier) => {
        setSelectedSupplier(supplier);
        setFormData({
            supplierName: supplier.supplier_name,
            contactPerson: supplier.contact_person || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || '',
        });
        setIsModalOpen(true);
    };

    const handleSaveSupplier = async () => {
        if (!formData.supplierName || !formData.phone) {
            toast.error('Supplier name and phone are required');
            return;
        }

        try {
            const supplierData = {
                supplierName: formData.supplierName,
                contactPerson: formData.contactPerson || null,
                phone: formData.phone,
                email: formData.email || null,
                address: formData.address || null,
            };

            if (selectedSupplier) {
                await supplierService.update(selectedSupplier.id, supplierData);
                toast.success('Supplier updated successfully');
            } else {
                await supplierService.create(supplierData);
                toast.success('Supplier created successfully');
            }

            setIsModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            console.error('Error saving supplier:', error);
            toast.error(error.response?.data?.message || 'Failed to save supplier');
        }
    };

    const handleDeleteSupplier = async (supplierId) => {
        if (!window.confirm('Are you sure you want to delete this supplier?')) {
            return;
        }

        try {
            await supplierService.delete(supplierId);
            toast.success('Supplier deleted successfully');
            fetchSuppliers();
        } catch (error) {
            console.error('Error deleting supplier:', error);
            toast.error('Failed to delete supplier');
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
                            <h1 className="text-3xl font-heading font-bold text-navy mb-2">Suppliers</h1>
                            <p className="text-text-muted">Manage your supplier database</p>
                        </div>
                        <Button variant="primary" icon={Plus} onClick={handleAddSupplier}>
                            Add Supplier
                        </Button>
                    </div>

                    {/* Suppliers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suppliers.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-text-muted">
                                No suppliers found. Click "Add Supplier" to create one.
                            </div>
                        ) : (
                            suppliers.map((supplier) => (
                                <Card key={supplier.id}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-text-primary">
                                                {supplier.supplier_name}
                                            </h3>
                                            {supplier.contact_person && (
                                                <p className="text-sm text-text-muted">Contact: {supplier.contact_person}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditSupplier(supplier)}
                                                className="p-2 hover:bg-cyan-50 rounded-lg transition-colors"
                                            >
                                                <Edit size={16} className="text-cyan" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSupplier(supplier.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} className="text-red-600" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {supplier.phone && (
                                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                <Phone size={16} />
                                                <span>{supplier.phone}</span>
                                            </div>
                                        )}
                                        {supplier.email && (
                                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                <Mail size={16} />
                                                <span>{supplier.email}</span>
                                            </div>
                                        )}
                                        {supplier.address && (
                                            <div className="flex items-start gap-2 text-sm text-text-muted mt-2">
                                                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                                                <span>{supplier.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Supplier Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            >
                <div className="space-y-4">
                    <Input
                        label="Supplier Name *"
                        type="text"
                        value={formData.supplierName}
                        onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                        placeholder="Enter supplier name"
                    />

                    <Input
                        label="Contact Person"
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="Enter contact person name"
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
                        <Button variant="primary" onClick={handleSaveSupplier} className="flex-1">
                            {selectedSupplier ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Suppliers;
