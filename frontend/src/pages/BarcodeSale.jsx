import React, { useState } from 'react';
import { ShoppingCart, Package, CheckCircle, AlertCircle, ArrowLeft, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarcodeInput from '../components/common/BarcodeInput';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import barcodeService from '../services/barcode.service';
import toast from 'react-hot-toast';

const BarcodeSale = () => {
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selling, setSelling] = useState(false);
    const [formData, setFormData] = useState({
        quantity: '',
        paymentMethod: 'cash',
        discount: '0'
    });

    const handleBarcodeScanned = async (barcode) => {
        setLoading(true);
        setProduct(null);
        setFormData({ quantity: '', paymentMethod: 'cash', discount: '0' });

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

    const handleSale = async (e) => {
        e.preventDefault();

        if (!product) {
            toast.error('Please scan a product first');
            return;
        }

        if (!formData.quantity || formData.quantity <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }

        if (parseInt(formData.quantity) > product.current_stock) {
            toast.error(`Insufficient stock! Available: ${product.current_stock} units`);
            return;
        }

        setSelling(true);

        try {
            const response = await barcodeService.createBarcodeSale({
                barcode: product.barcode,
                quantity: parseInt(formData.quantity),
                paymentMethod: formData.paymentMethod,
                discount: parseFloat(formData.discount) || 0
            });

            if (response.success) {
                toast.success(`Sale successful! Bill #${response.data.bill.billNumber}`);

                // Reset form
                setProduct(null);
                setFormData({ quantity: '', paymentMethod: 'cash', discount: '0' });
            }
        } catch (error) {
            console.error('Sale error:', error);
            toast.error(error.response?.data?.message || 'Sale failed');
        } finally {
            setSelling(false);
        }
    };

    const subtotal = formData.quantity && product
        ? (parseFloat(formData.quantity) * parseFloat(product.selling_price)).toFixed(2)
        : '0.00';

    const discountAmount = formData.discount ? parseFloat(formData.discount) : 0;
    const totalAmount = (parseFloat(subtotal) - discountAmount).toFixed(2);
    const remainingStock = product && formData.quantity
        ? product.current_stock - parseInt(formData.quantity)
        : 0;

    const getStockBadge = () => {
        if (!product) return null;

        if (product.current_stock === 0) {
            return <Badge variant="danger">Out of Stock</Badge>;
        } else if (product.current_stock < 10) {
            return <Badge variant="warning">Low Stock</Badge>;
        } else {
            return <Badge variant="success">In Stock</Badge>;
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/sales')}
                        icon={ArrowLeft}
                    >
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Barcode Sale</h1>
                        <p className="text-sm text-text-muted">Scan barcode to create sale</p>
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
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-text-primary">{product.product_name}</h3>
                                        {getStockBadge()}
                                    </div>
                                    <div className="space-y-1 text-sm text-text-muted">
                                        <p>SKU: {product.sku}</p>
                                        <p>Barcode: {product.barcode}</p>
                                        <p className="flex items-center gap-2">
                                            Available Stock:
                                            <span className={`font-medium ${product.current_stock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                                                {product.current_stock} units
                                            </span>
                                        </p>
                                        <p>Selling Price: <span className="font-medium text-text-primary">₹{product.selling_price}</span></p>
                                    </div>
                                </div>
                                <CheckCircle className="text-green-500" size={24} />
                            </div>

                            {product.current_stock === 0 && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
                                    <p className="text-sm text-red-700">This product is out of stock and cannot be sold.</p>
                                </div>
                            )}
                        </Card>
                    )}
                </div>

                {/* Right Column - Sale Form */}
                <div>
                    <Card>
                        <h2 className="text-lg font-semibold text-text-primary mb-4">Sale Details</h2>

                        {!product ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <AlertCircle className="text-gray-300 mb-3" size={48} />
                                <p className="text-text-muted">Scan a product to begin</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSale} className="space-y-4">
                                <Input
                                    label="Quantity"
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    placeholder="Enter quantity"
                                    min="1"
                                    max={product.current_stock}
                                    required
                                    disabled={product.current_stock === 0}
                                />

                                {formData.quantity && parseInt(formData.quantity) > product.current_stock && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                        <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
                                        <p className="text-sm text-red-700">
                                            Quantity exceeds available stock ({product.current_stock} units)
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Payment Method
                                    </label>
                                    <select
                                        name="paymentMethod"
                                        value={formData.paymentMethod}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
                                        required
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="upi">UPI</option>
                                        <option value="credit">Credit</option>
                                    </select>
                                </div>

                                <Input
                                    label="Discount (Optional)"
                                    type="number"
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleInputChange}
                                    placeholder="Enter discount amount"
                                    min="0"
                                    step="0.01"
                                />

                                {/* Bill Summary */}
                                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-muted">Subtotal:</span>
                                        <span className="font-medium">₹{subtotal}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-muted">Discount:</span>
                                            <span className="font-medium text-red-600">-₹{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="border-t pt-2 flex justify-between items-center">
                                        <span className="text-text-muted font-medium">Total Amount:</span>
                                        <span className="text-2xl font-bold text-cyan">₹{totalAmount}</span>
                                    </div>
                                    {formData.quantity && (
                                        <p className="text-xs text-text-muted mt-2">
                                            Remaining Stock: {product.current_stock} - {formData.quantity} = {remainingStock} units
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    loading={selling}
                                    icon={Receipt}
                                    disabled={product.current_stock === 0 || (formData.quantity && parseInt(formData.quantity) > product.current_stock)}
                                >
                                    Complete Sale
                                </Button>
                            </form>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BarcodeSale;
