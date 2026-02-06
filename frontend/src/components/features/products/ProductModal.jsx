import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { Package, DollarSign, Hash, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductModal = ({ isOpen, onClose, onSave, product }) => {
    const [formData, setFormData] = useState({
        productName: '',
        sku: '',
        purchasePrice: '',
        sellingPrice: '',
        currentStock: '',
        minStockLevel: '',
        maxStockLevel: '',
        description: '',
    });

    useEffect(() => {
        if (product) {
            setFormData({
                productName: product.product_name || '',
                sku: product.sku || '',
                purchasePrice: product.purchase_price || '',
                sellingPrice: product.selling_price || '',
                currentStock: product.current_stock || '',
                minStockLevel: product.min_stock_level || '',
                maxStockLevel: product.max_stock_level || '',
                description: product.description || '',
            });
        } else {
            // Reset form for new product
            setFormData({
                productName: '',
                sku: '',
                purchasePrice: '',
                sellingPrice: '',
                currentStock: '',
                minStockLevel: '',
                maxStockLevel: '',
                description: '',
            });
        }
    }, [product, isOpen]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (parseFloat(formData.sellingPrice) < parseFloat(formData.purchasePrice)) {
            toast.error('Selling price should be greater than purchase price');
            return;
        }

        if (parseInt(formData.minStockLevel) > parseInt(formData.maxStockLevel)) {
            toast.error('Min stock level should be less than max stock level');
            return;
        }

        onSave(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={product ? 'Edit Product' : 'Add New Product'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Product Name"
                        type="text"
                        name="productName"
                        placeholder="Enter product name"
                        value={formData.productName}
                        onChange={handleChange}
                        icon={Package}
                        required
                    />
                    <Input
                        label="SKU"
                        type="text"
                        name="sku"
                        placeholder="Enter SKU"
                        value={formData.sku}
                        onChange={handleChange}
                        icon={Hash}
                        required
                    />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Purchase Price"
                        type="number"
                        name="purchasePrice"
                        placeholder="Enter purchase price"
                        value={formData.purchasePrice}
                        onChange={handleChange}
                        icon={DollarSign}
                        required
                        min="0"
                        step="0.01"
                    />
                    <Input
                        label="Selling Price"
                        type="number"
                        name="sellingPrice"
                        placeholder="Enter selling price"
                        value={formData.sellingPrice}
                        onChange={handleChange}
                        icon={DollarSign}
                        required
                        min="0"
                        step="0.01"
                    />
                </div>

                {/* Stock Levels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Current Stock"
                        type="number"
                        name="currentStock"
                        placeholder="Enter quantity"
                        value={formData.currentStock}
                        onChange={handleChange}
                        required
                        min="0"
                    />
                    <Input
                        label="Min Stock Level"
                        type="number"
                        name="minStockLevel"
                        placeholder="Enter min stock level"
                        value={formData.minStockLevel}
                        onChange={handleChange}
                        icon={AlertTriangle}
                        required
                        min="0"
                    />
                    <Input
                        label="Max Stock Level"
                        type="number"
                        name="maxStockLevel"
                        placeholder="Enter max stock level"
                        value={formData.maxStockLevel}
                        onChange={handleChange}
                        required
                        min="0"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter product description"
                        rows="3"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent transition-all"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                        {product ? 'Update Product' : 'Add Product'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ProductModal;
