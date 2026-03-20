import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import type { Product } from '../types/index';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/adminService';
import ProductForm from '../components/ProductForm';
import toast from 'react-hot-toast';

const Inventory = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAddProduct = () => {
        setEditingProduct(undefined);
        setIsFormOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleDeleteProduct = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id);
                setProducts(prev => prev.filter(p => p.id !== id));
                toast.success('Product deleted successfully');
            } catch (error) {
                toast.error('Failed to delete product');
            }
        }
    };

    const handleFormSubmit = async (data: Omit<Product, 'id'> | Product) => {
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, data);
                toast.success('Product updated successfully');
            } else {
                await createProduct(data);
                toast.success('Product created successfully');
            }
            fetchProducts(); // Refresh list or update locally
            setIsFormOpen(false);
        } catch (error) {
            toast.error('Failed to save product');
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-serif text-deep-black">Inventory</h2>
                    <p className="text-gray-500 mt-1">Manage your luxury collection</p>
                </div>
                <button 
                    onClick={handleAddProduct}
                    className="flex items-center gap-2 bg-deep-black text-white px-6 py-3 text-sm tracking-wide hover:bg-gray-800 transition-colors"
                >
                    <Plus size={18} />
                    ADD PRODUCT
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-white p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 flex-1 border border-gray-200 px-3 py-2">
                    <Search size={18} className="text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        className="flex-1 outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                    <Filter size={18} />
                    Filter
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                     <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                        <tr>
                            <th className="px-6 py-4 font-medium">Product</th>
                            <th className="px-6 py-4 font-medium">Category</th>
                            <th className="px-6 py-4 font-medium">Price</th>
                            <th className="px-6 py-4 font-medium">Stock</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            // Skeleton Rows
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-10 w-32 bg-gray-200 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-200 rounded"></div></td>
                                    <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-gray-200 rounded inline-block"></div></td>
                                </tr>
                            ))
                        ) : filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {product.images[0] ? (
                                                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-300">Img</div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-deep-black">{product.name}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <span className="px-2 py-1 bg-gray-100 text-xs rounded-full">{product.category}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-deep-black">
                                        ${product.price ? product.price.toLocaleString() : '0.00'}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 text-xs font-medium ${product.stockCount > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                            {product.stockCount > 0 ? `${product.stockCount} in stock` : 'Out of Stock'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleEditProduct(product)}
                                                className="p-2 text-gray-400 hover:text-deep-black hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No products found. Add one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <div key={editingProduct ? editingProduct.id : 'new'}> {/* precise key to force re-render if needed */}
                 <ProductForm 
                    isOpen={isFormOpen} 
                    onClose={() => setIsFormOpen(false)} 
                    onSubmit={handleFormSubmit}
                    product={editingProduct}
                />
                </div>
            )}
        </div>
    );
};

export default Inventory;
