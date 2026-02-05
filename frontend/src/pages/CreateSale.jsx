import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import productService from '../services/product.service';
import customerService from '../services/customer.service';
import saleService from '../services/sale.service';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreateSale = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
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

    const fetchCustomers = async () => {
        try {
            const response = await customerService.getAll();
            if (response.success && response.data && Array.isArray(response.data.customers)) {
                setCustomers(response.data.customers);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.product_id === product.id);

        if (existingItem) {
            // Increase quantity
            setCart(cart.map(item =>
                item.product_id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            // Add new item
            setCart([...cart, {
                product_id: product.id,
                product_name: product.product_name,
                selling_price: product.selling_price,
                quantity: 1,
            }]);
        }
        toast.success(`${product.product_name} added to cart`);
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(cart.map(item =>
            item.product_id === productId
                ? { ...item, quantity: parseInt(newQuantity) }
                : item
        ));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.selling_price * item.quantity), 0);
    };

    const handleCreateSale = async () => {
        if (cart.length === 0) {
            toast.error('Please add products to cart');
            return;
        }

        try {
            setLoading(true);

            const saleData = {
                customerId: selectedCustomer || null,
                paymentMethod,
                items: cart.map(item => ({
                    productId: item.product_id,
                    quantity: item.quantity,
                    unitPrice: item.selling_price,
                })),
            };

            const response = await saleService.create(saleData);

            if (response.success) {
                toast.success('Sale created successfully!');
                navigate('/sales');
            }
        } catch (error) {
            console.error('Error creating sale:', error);
            toast.error(error.response?.data?.message || 'Failed to create sale');
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
                    <h1 className="text-3xl font-heading font-bold text-navy mb-2">Create New Sale</h1>
                    <p className="text-text-muted">Add products to cart and complete the sale</p>
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
                                                <p className="text-xs text-text-muted">Stock: {product.current_stock}</p>
                                            </div>
                                            <p className="font-semibold text-cyan">₹{product.selling_price}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Cart & Checkout */}
                    <div>
                        <Card>
                            <h3 className="text-lg font-semibold text-text-primary mb-4">Cart</h3>

                            {/* Customer Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Customer (Optional)
                                </label>
                                <select
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
                                >
                                    <option value="">Walk-in Customer</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.customer_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Method */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Payment Method
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="credit">Credit</option>
                                </select>
                            </div>

                            {/* Cart Items */}
                            <div className="border-t border-b border-gray-200 py-4 mb-4 max-h-64 overflow-y-auto">
                                {cart.length === 0 ? (
                                    <p className="text-center text-text-muted py-8">Cart is empty</p>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map(item => (
                                            <div key={item.product_id} className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-text-primary">{item.product_name}</p>
                                                    <p className="text-xs text-text-muted">₹{item.selling_price} each</p>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.product_id, e.target.value)}
                                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                                />
                                                <button
                                                    onClick={() => removeFromCart(item.product_id)}
                                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 size={16} className="text-red-600" />
                                                </button>
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

                            {/* Complete Sale Button */}
                            <Button
                                variant="primary"
                                className="w-full"
                                onClick={handleCreateSale}
                                loading={loading}
                                disabled={cart.length === 0}
                            >
                                Complete Sale
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateSale;
