import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, IndianRupee, Printer, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import productService from '../services/product.service';
import saleService from '../services/sale.service';
import Button from '../components/common/Button';
import Receipt from '../components/pos/Receipt';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Manual POS Billing Page
 * 
 * Simple billing interface where admin can:
 * - View all available products
 * - Search/filter products
 * - Add products to bill
 * - Adjust quantities
 * - Complete payment and generate bill
 */

const POSBilling = () => {
    const navigate = useNavigate();
    const receiptRef = React.useRef(null);

    // Products state
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Bill state
    const [billItems, setBillItems] = useState([]);
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [currentBill, setCurrentBill] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);

    // Load products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    // Filter products based on search
    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = products.filter(product =>
                product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchQuery, products]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            // API interceptor returns response.data directly
            // So the response IS the data object with { success, data: { products } }
            const response = await productService.getAll();
            console.log('Products API response:', response);

            // The response structure should be: { success: true, data: { products: [...] } }
            // OR it could be: { products: [...] }
            // OR it could be just an array: [...]

            let productsArray = [];

            if (response && response.data && Array.isArray(response.data.products)) {
                // Format: { success: true, data: { products: [...] } }
                productsArray = response.data.products;
            } else if (response && Array.isArray(response.products)) {
                // Format: { products: [...] }
                productsArray = response.products;
            } else if (Array.isArray(response)) {
                // Format: [...]
                productsArray = response;
            } else {
                console.error('Unexpected response format:', response);
                toast.error('Failed to load products - unexpected format');
            }

            setProducts(productsArray);
            setFilteredProducts(productsArray);

        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
            setProducts([]);
            setFilteredProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // Add product to bill
    const addToBill = (product) => {
        if (product.current_stock <= 0) {
            toast.error('Product out of stock');
            return;
        }

        const existingItem = billItems.find(item => item.id === product.id);

        if (existingItem) {
            if (existingItem.quantity >= product.current_stock) {
                toast.error('Cannot add more than available stock');
                return;
            }
            updateQuantity(product.id, existingItem.quantity + 1);
        } else {
            const newItem = {
                id: product.id,
                name: product.product_name,
                sku: product.sku,
                price: parseFloat(product.selling_price),
                quantity: 1,
                maxStock: product.current_stock,
                total: parseFloat(product.selling_price)
            };
            setBillItems([...billItems, newItem]);
            toast.success(`Added ${product.product_name} to bill`);
        }
    };

    // Update quantity
    const updateQuantity = (productId, newQuantity) => {
        const item = billItems.find(i => i.id === productId);

        if (newQuantity <= 0) {
            removeFromBill(productId);
            return;
        }

        if (newQuantity > item.maxStock) {
            toast.error('Cannot exceed available stock');
            return;
        }

        setBillItems(billItems.map(item =>
            item.id === productId
                ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
                : item
        ));
    };

    // Remove from bill
    const removeFromBill = (productId) => {
        setBillItems(billItems.filter(item => item.id !== productId));
    };

    // Calculate totals
    const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discountPercentage) / 100;
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * 0.18; // 18% GST on TAXABLE amount
    const total = taxableAmount + tax;

    // Complete payment
    const handleCompletePayment = async () => {
        if (billItems.length === 0) {
            toast.error('Please add items to the bill');
            return;
        }

        try {
            setLoading(true);

            // Prepare sale data - ALL fields must be camelCase to match backend
            const saleData = {
                customerId: null, // Backend expects customerId (camelCase)
                items: billItems.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    unitPrice: item.price
                })),
                paymentMethod: paymentMethod,
                paymentStatus: 'paid',
                paidAmount: total,
                discountPercentage: discountPercentage,
                taxPercentage: 18,
                notes: 'Manual POS Billing'
            };

            console.log('Creating sale:', saleData);

            // Create sale using regular sale endpoint (NO BARCODE)
            const response = await saleService.create(saleData);
            console.log('Sale response:', response);

            if (response && (response.sale || response.data)) {
                const saleData = response.sale || response.data || response;

                // Prepare receipt data
                const receipt = {
                    billNumber: saleData.bill_number || saleData.id || 'N/A',
                    date: new Date().toISOString(),
                    items: billItems,
                    subtotal: subtotal,
                    tax: tax,
                    discount: discountAmount,
                    total: total,
                    paymentMethod: paymentMethod,
                    cashierName: 'Admin'
                };

                setCurrentBill(receipt);
                setShowReceipt(true);

                // Clear bill
                setBillItems([]);
                setDiscountPercentage(0);

                toast.success('Payment completed successfully!');

                // Refresh products to update stock
                fetchProducts();
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to complete payment');
        } finally {
            setLoading(false);
        }
    };

    // Print receipt
    const handlePrintFn = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Bill-${currentBill?.billNumber || 'Receipt'}`,
    });

    const handlePrint = () => {
        if (!receiptRef.current) {
            toast.error('Receipt content not found');
            return;
        }
        handlePrintFn();
    };

    // Download receipt as PDF
    const handleDownloadPDF = async () => {
        try {
            const receiptElement = receiptRef.current;
            if (!receiptElement) return;

            // Convert receipt to canvas
            const canvas = await html2canvas(receiptElement, {
                scale: 2,
                logging: false,
                useCORS: true
            });

            // Create PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Bill-${currentBill?.billNumber}.pdf`);

            toast.success('Receipt downloaded successfully');
        } catch (error) {
            console.error('PDF download error:', error);
            toast.error('Failed to download PDF');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manual Billing</h1>
                        <p className="text-sm text-gray-500 mt-1">Select products and create bills</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/sales')}
                    >
                        View Sales History
                    </Button>
                </div>
            </div>

            <div className="flex h-[calc(100vh-88px)]">
                {/* Left: Products List */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Available Products</h2>
                            <div className="relative w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan"></div>
                                <p className="mt-2 text-gray-500">Loading products...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-12">
                                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-gray-500">No products found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => addToBill(product)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{product.product_name}</h3>
                                                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                                            </div>
                                            {product.current_stock <= product.min_stock_level && (
                                                <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded">
                                                    Low Stock
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <div>
                                                <p className="text-lg font-bold text-cyan">₹{parseFloat(product.selling_price).toFixed(2)}</p>
                                                <p className="text-xs text-gray-500">Stock: {product.current_stock}</p>
                                            </div>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addToBill(product);
                                                }}
                                                disabled={product.current_stock <= 0}
                                            >
                                                <Plus size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Current Bill */}
                <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <ShoppingCart size={20} />
                            Current Bill ({billItems.length} items)
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {billItems.length === 0 ? (
                            <div className="text-center py-12">
                                <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-2 text-gray-500 text-sm">No items in bill</p>
                                <p className="text-gray-400 text-xs mt-1">Click on products to add</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {billItems.map((item) => (
                                    <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                                                <p className="text-xs text-gray-500">₹{item.price.toFixed(2)} each</p>
                                            </div>
                                            <button
                                                onClick={() => removeFromBill(item.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <p className="font-semibold text-gray-900">₹{item.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bill Summary */}
                    <div className="border-t border-gray-200 p-6 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax (18%):</span>
                                <span className="font-medium">₹{tax.toFixed(2)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-600">Discount (%):</label>
                                <div className="relative w-24">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={discountPercentage}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setDiscountPercentage(Math.min(100, Math.max(0, val)));
                                        }}
                                        className="w-full pl-2 pr-6 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-200">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-900">TOTAL:</span>
                                    <span className="font-bold text-xl text-cyan">₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan"
                            >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="upi">UPI</option>
                            </select>
                        </div>

                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={handleCompletePayment}
                            disabled={billItems.length === 0 || loading}
                        >
                            <IndianRupee size={20} />
                            Complete Payment
                        </Button>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && currentBill && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Bill Generated</h3>
                                <button
                                    onClick={() => {
                                        setShowReceipt(false);
                                        setCurrentBill(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="mb-6">
                                <Receipt ref={receiptRef} bill={currentBill} />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    onClick={handlePrint}
                                >
                                    <Printer size={18} />
                                    Print
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={handleDownloadPDF}
                                >
                                    <Download size={18} />
                                    Download PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowReceipt(false);
                                        setCurrentBill(null);
                                    }}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSBilling;
