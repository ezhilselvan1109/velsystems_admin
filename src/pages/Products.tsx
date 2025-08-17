import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { productService } from '../services/product';
import { Product, ProductFormData } from '../types/product';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import ProductForm from '../components/ProductForm';
import LoadingSpinner from '../components/LoadingSpinner';

const Products: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch products with pagination
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', currentPage, pageSize, sortBy, sortDir],
    queryFn: () => productService.getProducts(currentPage, pageSize, sortBy, sortDir),
  });

  // Fetch product statistics
  const { data: stats } = useQuery({
    queryKey: ['products', 'stats'],
    queryFn: productService.getStats,
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateModalOpen(false);
      toast.success('Product created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product');
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
      productService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      toast.success('Product updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product');
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      toast.success('Product deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });

  // Handlers
  const handleCreateProduct = useCallback((data: ProductFormData) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const handleUpdateProduct = useCallback((data: ProductFormData) => {
    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, data });
    }
  }, [selectedProduct, updateMutation]);

  const handleDeleteProduct = useCallback(() => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id);
    }
  }, [selectedProduct, deleteMutation]);

  const handleViewClick = useCallback((product: Product) => {
    navigate(`/products/${product.id}`);
  }, [navigate]);

  const handleEditClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page when searching
  }, []);

  // Filtered products (client-side filtering for search)
  const filteredProducts = useMemo(() => {
    const products = productsData?.content || [];
    if (!products.length || !searchTerm) return products;

    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productType.name.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [productsData?.content, searchTerm]);

  // Utility functions
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }, []);

  const getStockStatus = useCallback((stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock <= 10) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
  }, []);

  const getPrimaryImage = useCallback((images: any[]) => {
    const primary = images.find(img => img.isPrimary);
    return primary?.imageUrl || images[0]?.imageUrl || null;
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load products</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600">Manage your product catalog and inventory</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Product Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.totalProducts || 0}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats?.lowStockProducts || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats?.outOfStockProducts || 0}
              </p>
            </div>
            <Package className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products by name, brand, or type..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Product</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900 hidden md:table-cell">Brand</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900 hidden lg:table-cell">Type</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Price</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Stock</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    const primaryImage = getPrimaryImage(product.image);
                    
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center space-x-3">
                            {primaryImage ? (
                              <img
                                src={primaryImage}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500 font-mono truncate">
                                {product.slug}
                              </p>
                              <div className="md:hidden mt-1">
                                <span className="text-xs text-gray-500">
                                  {product.brand.name} • {product.productType.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-gray-900 hidden md:table-cell">
                          {product.brand.name}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-gray-900 hidden lg:table-cell">
                          {product.productType.name}
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <span className="font-medium text-gray-900">
                            {formatPrice(product.price)}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{product.stock}</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 w-fit ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleViewClick(product)}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                              title="View product"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(product)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(product)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {productsData && (
              <Pagination
                currentPage={productsData.number}
                totalPages={productsData.totalPages}
                totalElements={productsData.totalElements}
                pageSize={productsData.size}
                onPageChange={handlePageChange}
              />
            )}

            {/* Empty State */}
            {filteredProducts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No products match your search' : 'No products found'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create your first product
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Product"
        size="xl"
      >
        <ProductForm
          onSubmit={handleCreateProduct}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        title="Edit Product"
        size="xl"
      >
        <ProductForm
          product={selectedProduct || undefined}
          onSubmit={handleUpdateProduct}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedProduct(null);
          }}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Floating Add Button (Mobile) */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors md:hidden z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Products;