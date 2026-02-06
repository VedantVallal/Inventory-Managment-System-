import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import productService from '../services/product.service';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import ProductModal from '../components/features/products/ProductModal';
import toast from 'react-hot-toast';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        // Filter products based on search term
        if (!Array.isArray(products)) {
            setFilteredProducts([]);
            return;
        }

        if (searchTerm) {
            const filtered = products.filter(
                (product) =>
                    product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchTerm, products]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await productService.getAll();


            if (response.success && response.data && Array.isArray(response.data.products)) {
                setProducts(response.data.products);
                setFilteredProducts(response.data.products);
            } else {
                console.error('Invalid products data:', response);
                setProducts([]);
                setFilteredProducts([]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            setFilteredProducts([]);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const response = await productService.delete(productId);
            if (response.success) {
                toast.success('Product deleted successfully');
                fetchProducts();
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        }
    };

    const handleSaveProduct = async (formData) => {
        try {
            let response;
            if (selectedProduct) {
                // Update existing product
                response = await productService.update(selectedProduct.id, formData);
                toast.success('Product updated successfully');
            } else {
                // Create new product
                response = await productService.create(formData);
                toast.success('Product added successfully');
            }

            if (response.success) {
                setIsModalOpen(false);
                fetchProducts();
            }
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error(error.response?.data?.message || 'Failed to save product');
        }
    };

    const getStockBadge = (product) => {
        if (product.current_stock === 0) {
            return <Badge variant="danger">Out of Stock</Badge>;
        } else if (product.current_stock <= product.min_stock_level) {
            return <Badge variant="warning">Low Stock</Badge>;
        } else if (product.current_stock >= product.max_stock_level) {
            return <Badge variant="info">Overstock</Badge>;
        } else {
            return <Badge variant="success">In Stock</Badge>;
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
                            <h1 className="text-3xl font-heading font-bold text-navy mb-2">Products</h1>
                            <p className="text-text-muted">Manage your inventory products</p>
                            <p className="text-sm font-medium text-cyan mt-1">Total Products: {products.length || 0}</p>
                        </div>
                        <Button variant="primary" icon={Plus} onClick={handleAddProduct}>
                            Add Product
                        </Button>
                    </div>

                    {/* Search and Filter */}
                    <div className="bg-white rounded-card shadow-card p-4 mb-6">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    type="text"
                                    placeholder="Search by product name or SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    icon={Search}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="bg-white rounded-card shadow-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200 bg-bg-secondary">
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Product</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary" title="Stock Keeping Unit — unique product identifier">SKU</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">QR Code</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary" title="Available inventory stock">Quantity</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary" title="Cost price per unit">Purchase Price / Unit</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary" title="Selling price per unit">Selling Price / Unit</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-text-muted">
                                                No products found. Click "Add Product" to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <tr
                                                key={product.id}
                                                className="border-b border-gray-200 hover:bg-bg-primary transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-text-primary">{product.product_name}</p>
                                                        {product.description && (
                                                            <p className="text-xs text-text-muted mt-1 truncate max-w-xs">
                                                                {product.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-text-secondary">{product.sku}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-text-primary">{product.current_stock}</span>
                                                        {product.current_stock <= product.min_stock_level && (
                                                            <AlertTriangle size={16} className="text-yellow-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-text-muted">Min: {product.min_stock_level}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-text-secondary">
                                                    ₹{parseFloat(product.purchase_price).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-text-primary">
                                                    ₹{parseFloat(product.selling_price).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">{getStockBadge(product)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditProduct(product)}
                                                            className="p-2 hover:bg-cyan-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit size={18} className="text-cyan" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} className="text-red-600" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-6 text-text-muted">
                        Showing {filteredProducts.length} of {products.length} products
                    </div>
                </div>
            </div>

            {/* Product Modal */}
            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProduct}
                product={selectedProduct}
            />
        </>
    );
};

export default Products;
