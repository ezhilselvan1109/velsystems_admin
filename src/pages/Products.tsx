import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Package, AlertTriangle, Filter, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { productService } from '../services/product';
import { brandService } from '../services/brand';
import { categoryService } from '../services/category';
import { Product, ProductFormData, ProductFilterParams } from '../types/product';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import ProductForm from '../components/ProductForm';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomSelect from '../components/CustomSelect';

const Products: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('1');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Build filter parameters
  const filterParams: ProductFilterParams = useMemo(() => ({
    brandId: brandFilter || undefined,
    categoryId: categoryFilter || undefined,
    keyword: searchTerm || undefined,
    status: statusFilter as '0' | '1' | '2',
    page: currentPage,
    size: pageSize,
    sortBy,
    direction: sortDir,
  }), [brandFilter, categoryFilter, searchTerm, statusFilter, currentPage, pageSize, sortBy, sortDir]);

  // Fetch products with filters
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', 'filtered', filterParams],
    queryFn: () => productService.getFilteredProducts(filterParams),
  });

  // Fetch brands for filter
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getBrands,
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: categoryService.getAllCategories,
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
    setCurrentPage(0);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setBrandFilter('');
    setCategoryFilter('');
    setStatusFilter('1');
    setCurrentPage(0);
  }, []);

  // Utility functions
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case '1': return 'bg-green-100 text-green-800';
      case '0': return 'bg-gray-100 text-gray-800';
      case '2': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case '1': return 'Active';
      case '0': return 'Inactive';
      case '2': return 'Draft';
      default: return 'Unknown';
    }
  }, []);

  const getPrimaryImage = useCallback((variants: any[]) => {
    if (!variants?.length) return null;
    
    for (const variant of variants) {
      if (variant.images?.length) {
        const primary = variant.images.find((img: any) => img.isPrimary);
        if (primary) return primary.imageUrl;
        return variant.images[0]?.imageUrl;
      }
    }
    return null;
  }, []);

  const getLowestPrice = useCallback((variants: any[]) => {
    if (!variants?.length) return 0;
    return Math.min(...variants.map(v => v.price || 0));
  }, []);

  // Filter options
  const brandOptions = brands?.filter(brand => brand.status === 1).map(brand => ({
    value: brand.id,
    label: brand.name,
  })) || [];

  const categoryOptions = categories?.map(category => ({
    value: category.id,
    label: category.name,
  })) || [];

  const statusOptions = [
    { value: '1', label: 'Active' },
    { value: '0', label: 'Inactive' },
    { value: '2', label: 'Draft' },
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'name', label: 'Name' },
    { value: 'updatedAt', label: 'Updated Date' },
  ];

  const hasActiveFilters = searchTerm || brandFilter || categoryFilter || statusFilter !== '1';

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your product catalog and inventory</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center shadow-sm text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Product Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">
                {stats?.totalProducts || 0}
              </p>
            </div>
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">
                {stats?.activeProducts || 0}
              </p>
            </div>
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-600 mt-1">
                {stats?.inactiveProducts || 0}
              </p>
            </div>
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products by name, slug, brand..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 border rounded-lg transition-colors text-sm ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {[searchTerm, brandFilter, categoryFilter, statusFilter !== '1'].filter(Boolean).length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Brand Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                <div className="block sm:hidden">
                  <select
                    value={brandFilter}
                    onChange={(e) => {
                      setBrandFilter(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  >
                    <option value="">All Brands</option>
                    {brandOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hidden sm:block">
                  <CustomSelect
                    options={[{ value: '', label: 'All Brands' }, ...brandOptions]}
                    value={brandFilter}
                    onChange={(value) => {
                      setBrandFilter(value);
                      setCurrentPage(0);
                    }}
                    placeholder="All Brands"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <div className="block sm:hidden">
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  >
                    <option value="">All Categories</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hidden sm:block">
                  <CustomSelect
                    options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
                    value={categoryFilter}
                    onChange={(value) => {
                      setCategoryFilter(value);
                      setCurrentPage(0);
                    }}
                    placeholder="All Categories"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <div className="block sm:hidden">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hidden sm:block">
                  <CustomSelect
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(value) => {
                      setStatusFilter(value);
                      setCurrentPage(0);
                    }}
                    placeholder="Select status"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                <div className="flex gap-2">
                  <div className="flex-1 block sm:hidden">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 hidden sm:block">
                    <CustomSelect
                      options={sortOptions}
                      value={sortBy}
                      onChange={setSortBy}
                      placeholder="Sort by"
                      className="text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    title={`Sort ${sortDir === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortDir === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
                    <th className="text-left py-3 px-3 sm:px-6 font-medium text-gray-900 text-sm">Product</th>
                    <th className="text-left py-3 px-3 sm:px-6 font-medium text-gray-900 text-sm hidden md:table-cell">Brand</th>
                    <th className="text-left py-3 px-3 sm:px-6 font-medium text-gray-900 text-sm hidden lg:table-cell">Category</th>
                    <th className="text-left py-3 px-3 sm:px-6 font-medium text-gray-900 text-sm">Price</th>
                    <th className="text-left py-3 px-3 sm:px-6 font-medium text-gray-900 text-sm hidden sm:table-cell">Status</th>
                    <th className="text-left py-3 px-3 sm:px-6 font-medium text-gray-900 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {productsData?.content.map((product) => {
                    const primaryImage = getPrimaryImage(product.variants);
                    const lowestPrice = getLowestPrice(product.variants);

                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="py-3 sm:py-4 px-3 sm:px-6">
                          <div className="flex items-center space-x-3">
                            {primaryImage ? (
                              <img
                                src={primaryImage}
                                alt={product.name}
                                className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500 font-mono truncate">
                                {product.slug}
                              </p>
                              <div className="md:hidden lg:hidden mt-1">
                                <span className="text-xs text-gray-500">
                                  {/* {product.brand.name} */}
                                </span>
                                {/* <span className="sm:hidden"> • {product.category.name}</span> */}
                              </div>
                              <div className="sm:hidden mt-1">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.status)}`}>
                                  {getStatusText(product.status)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6 text-sm text-gray-900 hidden md:table-cell">
                          {/* {product.brand.name} */}
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6 text-sm text-gray-900 hidden lg:table-cell">
                          {/* {product.category.name} */}
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6">
                          <span className="font-medium text-gray-900 text-sm">
                            {lowestPrice > 0 ? formatPrice(lowestPrice) : 'N/A'}
                          </span>
                          {product.variants.length > 1 && (
                            <p className="text-xs text-gray-500">
                              {product.variants.length} variants
                            </p>
                          )}
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6 hidden sm:table-cell">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.status)}`}>
                            {getStatusText(product.status)}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6">
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
            {productsData && productsData.totalPages > 1 && (
              <Pagination
                currentPage={productsData.number}
                totalPages={productsData.totalPages}
                totalElements={productsData.totalElements}
                pageSize={productsData.size}
                onPageChange={handlePageChange}
              />
            )}

            {/* Empty State */}
            {productsData?.content.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {hasActiveFilters ? 'No products match your filters' : 'No products found'}
                </p>
                {!hasActiveFilters && (
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