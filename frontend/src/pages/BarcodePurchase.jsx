import React, { useState } from 'react';
import { Package, Plus, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarcodeInput from '../components/common/BarcodeInput';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import barcodeService from '../services/barcode.service';
import toast from 'react-hot-toast';

const BarcodePurchase = () => {
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [formData, setFormData] = useState({
        quantity: '',
        purchasePrice: '',
        notes: ''
    });

    const handleBarcodeScanned = async (barcode) => {
        setLoading(true);
        setProduct(null);
        setFormData({ quantity: '', purchasePrice: '', notes: '' });

        try {
            const response = await barcodeService.getProductByBarcode(barcode);

            if (response.success && response.data.product) {
                setProduct(response.data.product);
                toast.success(`Product found: ${response.data.product.product_name}`);
            } else {
                toast.error('Product not found');
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch product');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePurchase = async (e) => {
        e.preventDefault();

        if (!product) {
            toast.error('Please scan a product first');
            return;
        }

        if (!formData.quantity || formData.quantity <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }

        if (!formData.purchasePrice || formData.purchasePrice < 0) {
            toast.error('Please enter a valid purchase price');
            return;
        }

        setPurchasing(true);

        try {
            const response = await barcodeService.createBarcodePurchase({
                barcode: product.barcode,
                quantity: parseInt(formData.quantity),
                purchasePrice: parseFloat(formData.purchasePrice),
                notes: formData.notes
            });

            if (response.success) {
                toast.success(`Purchase successful! Stock updated: ${response.data.product.previousStock} → ${response.data.product.newStock}`);

                // Reset form
                setProduct(null);
                setFormData({ quantity: '', purchasePrice: '', notes: '' });
            }
        } catch (error) {
            console.error('Purchase error:', error);
            toast.error(error.response?.data?.message || 'Purchase failed');
        } finally {
            setPurchasing(false);
        }
    };

    const totalAmount = formData.quantity && formData.purchasePrice
        ? (parseFloat(formData.quantity) * parseFloat(formData.purchasePrice)).toFixed(2)
        : '0.00';

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/purchases')}
                        icon={ArrowLeft}
                    >
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Barcode Purchase</h1>
                        <p className="text-sm text-text-muted">Scan barcode to add stock</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Barcode Scanner */}
                <div className="space-y-6">
                    <Card>
                        <h2 className="text-lg font-semibold text-text-primary mb-4">Scan Product</h2>
                        <BarcodeInput
                            onScan={handleBarcodeScanned}
                            onError={(error) => toast.error(error)}
                            placeholder="Scan or enter product barcode"
                        />
                    </Card>

                    {/* Product Preview */}
                    {loading && (
                        <Card>
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan"></div>
                            </div>
                        </Card>
                    )}

                    {product && (
                        <Card className="border-2 border-cyan">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-cyan/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Package className="text-cyan" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-text-primary mb-1">{product.product_name}</h3>
                                    <div className="space-y-1 text-sm text-text-muted">
                                        <p>SKU: {product.sku}</p>
                                        <p>Barcode: {product.barcode}</p>
                                        <p>Current Stock: <span className="font-medium text-text-primary">{product.current_stock} units</span></p>
                                        <p>Category: {product.categories?.category_name || 'N/A'}</p>
                                    </div>
                                </div>
                                <CheckCircle className="text-green-500" size={24} />
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Column - Purchase Form */}
                <div>
                    <Card>
                        <h2 className="text-lg font-semibold text-text-primary mb-4">Purchase Details</h2>

                        {!product ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <AlertCircle className="text-gray-300 mb-3" size={48} />
                                <p className="text-text-muted">Scan a product to begin</p>
                            </div>
                        ) : (
                            <form onSubmit={handlePurchase} className="space-y-4">
                                <Input
                                    label="Quantity"
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    placeholder="Enter quantity"
                                    min="1"
                                    required
                                />

                                <Input
                                    label="Purchase Price (per unit)"
                                    type="number"
                                    name="purchasePrice"
                                    value={formData.purchasePrice}
                                    onChange={handleInputChange}
                                    placeholder="Enter purchase price"
                                    min="0"
                                    step="0.01"
                                    required
                                />

                                <Input
                                    label="Notes (Optional)"
                                    type="text"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Add notes"
                                />

                                {/* Total Amount */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-muted">Total Amount:</span>
                                        <span className="text-2xl font-bold text-cyan">₹{totalAmount}</span>
                                    </div>
                                    {formData.quantity && (
                                        <p className="text-xs text-text-muted mt-1">
                                            New Stock: {product.current_stock} + {formData.quantity} = {parseInt(product.current_stock) + parseInt(formData.quantity)} units
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    loading={purchasing}
                                    icon={Plus}
                                >
                                    Complete Purchase
                                </Button>
                            </form>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BarcodePurchase;
