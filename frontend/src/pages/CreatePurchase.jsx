import React, { useState, useEffect } from 'react';
import { Trash2, Search } from 'lucide-react';
import productService from '../services/product.service';
import supplierService from '../services/supplier.service';
import purchaseService from '../services/purchase.service';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreatePurchase = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchSuppliers();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await productService.getAll();
            if (response.success && response.data && Array.isArray(response.data.products)) {
                setProducts(response.data.products);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await supplierService.getAll();
            if (response.success && response.data && Array.isArray(response.data.suppliers)) {
                setSuppliers(response.data.suppliers);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.product_id === product.id);

        if (existingItem) {
            toast.info(`${product.product_name} is already in cart`);
            return;
        }

        // Add new item with purchase price (default to current purchase price)
        setCart([...cart, {
            product_id: product.id,
            product_name: product.product_name,
            purchase_price: product.purchase_price,
            quantity: 1,
        }]);
        toast.success(`${product.product_name} added to cart`);
    };

    const updateQuantity = (productId, newQuantity) => {
        // Allow empty string for better typing experience
        if (newQuantity === '') {
            setCart(cart.map(item =>
                item.product_id === productId
                    ? { ...item, quantity: '' }
                    : item
            ));
            return;
        }

        const qty = parseInt(newQuantity);
        if (qty <= 0) {
            // Optional: Ask for confirmation or just return to avoid accidental deletion
            // For now, we'll just not update if <= 0 to prevent issues, user can use delete button
            return;
        }

        setCart(cart.map(item =>
            item.product_id === productId
                ? { ...item, quantity: qty }
                : item
        ));
    };

    const updatePurchasePrice = (productId, newPrice) => {
        // Allow empty string
        if (newPrice === '') {
            setCart(cart.map(item =>
                item.product_id === productId
                    ? { ...item, purchase_price: '' }
                    : item
            ));
            return;
        }

        const price = parseFloat(newPrice);
        if (price < 0) return;

        setCart(cart.map(item =>
            item.product_id === productId
                ? { ...item, purchase_price: price }
                : item
        ));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.purchase_price * item.quantity), 0);
    };

    const handleCreatePurchase = async () => {
        if (!selectedSupplier) {
            toast.error('Please select a supplier');
            return;
        }

        if (cart.length === 0) {
            toast.error('Please add products to cart');
            return;
        }

        try {
            setLoading(true);

            // Generate invoice number
            const invoiceNumber = `PUR-${Date.now()}`;

            const purchaseData = {
                supplierId: selectedSupplier,
                invoiceNumber,
                purchaseDate: new Date().toISOString().split('T')[0],
                items: cart.map(item => ({
                    productId: item.product_id,
                    quantity: item.quantity,
                    purchasePrice: item.purchase_price, // Changed from unitPrice
                })),
            };

            const response = await purchaseService.create(purchaseData);

            if (response.success) {
                toast.success('Purchase created successfully!');
                navigate('/purchases');
            }
        } catch (error) {
            console.error('Error creating purchase:', error);
            toast.error(error.response?.data?.message || 'Failed to create purchase');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product =>
        product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-heading font-bold text-navy mb-2">Create New Purchase</h1>
                    <p className="text-text-muted">Record product purchases from suppliers</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Products List */}
                    <div className="lg:col-span-2">
                        <Card>
                            <h3 className="text-lg font-semibold text-text-primary mb-4">Select Products</h3>

                            {/* Search */}
                            <Input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={Search}
                                className="mb-4"
                            />

                            {/* Products Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                                {filteredProducts.map(product => (
                                    <div
                                        key={product.id}
                                        className="border border-gray-200 rounded-lg p-3 hover:border-cyan transition-colors cursor-pointer"
                                        onClick={() => addToCart(product)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-text-primary">{product.product_name}</p>
                                                <p className="text-xs text-text-muted">SKU: {product.sku}</p>
                                                <p className="text-xs text-text-muted">Current Stock: {product.current_stock}</p>
                                            </div>
                                            <p className="font-semibold text-cyan">₹{product.purchase_price}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Cart & Checkout */}
                    <div>
                        <Card>
                            <h3 className="text-lg font-semibold text-text-primary mb-4">Purchase Details</h3>

                            {/* Supplier Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Supplier *
                                </label>
                                <select
                                    value={selectedSupplier}
                                    onChange={(e) => setSelectedSupplier(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.supplier_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Cart Items */}
                            <div className="border-t border-b border-gray-200 py-4 mb-4 max-h-96 overflow-y-auto">
                                {cart.length === 0 ? (
                                    <p className="text-center text-text-muted py-8">Cart is empty</p>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.map(item => (
                                            <div key={item.product_id} className="border-b border-gray-100 pb-3 last:border-0">
                                                <div className="flex items-start justify-between mb-2">
                                                    <p className="text-sm font-medium text-text-primary flex-1">{item.product_name}</p>
                                                    <button
                                                        onClick={() => removeFromCart(item.product_id)}
                                                        className="p-1 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <Trash2 size={14} className="text-red-600" />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-text-muted mb-1 block">Quantity</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.product_id, e.target.value)}
                                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-cyan focus:border-transparent outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-text-muted mb-1 block">Price (₹)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.purchase_price}
                                                            onChange={(e) => updatePurchasePrice(item.product_id, e.target.value)}
                                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-cyan focus:border-transparent outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <p className="text-xs text-text-muted mt-1">
                                                    Subtotal: ₹{(item.quantity * item.purchase_price).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Total */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total:</span>
                                    <span className="text-cyan">₹{calculateTotal().toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Validation Message */}
                            {(!selectedSupplier || cart.length === 0) && (
                                <p className="text-xs text-red-500 mb-2 text-center">
                                    {!selectedSupplier ? 'Select a supplier' : 'Add products to cart'} to continue
                                </p>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate('/purchases')}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-[2]"
                                    onClick={handleCreatePurchase}
                                    loading={loading}
                                    disabled={cart.length === 0 || !selectedSupplier}
                                >
                                    Complete Purchase
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePurchase;
