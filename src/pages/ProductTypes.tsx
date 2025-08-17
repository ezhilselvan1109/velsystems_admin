import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Tag } from 'lucide-react';
import { toast } from 'react-toastify';
import { productTypeService } from '../services/productType';
import { ProductType, ProductTypeFormData } from '../types/productType';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductTypeForm from '../components/ProductTypeForm';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductTypes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);

  const queryClient = useQueryClient();

  // Fetch product types
  const {
    data: productTypes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product-types'],
    queryFn: productTypeService.getProductTypes,
  });

  // Create product type mutation
  const createMutation = useMutation({
    mutationFn: productTypeService.createProductType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
      setIsCreateModalOpen(false);
      toast.success('Product type created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product type');
    },
  });

  // Update product type mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductTypeFormData }) =>
      productTypeService.updateProductType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
      setIsEditModalOpen(false);
      setSelectedProductType(null);
      toast.success('Product type updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product type');
    },
  });

  // Delete product type mutation
  const deleteMutation = useMutation({
    mutationFn: productTypeService.deleteProductType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
      setIsDeleteDialogOpen(false);
      setSelectedProductType(null);
      toast.success('Product type deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product type');
    },
  });

  // Handlers
  const handleCreateProductType = useCallback((data: ProductTypeFormData) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const handleUpdateProductType = useCallback((data: ProductTypeFormData) => {
    if (selectedProductType) {
      updateMutation.mutate({ id: selectedProductType.id, data });
    }
  }, [selectedProductType, updateMutation]);

  const handleDeleteProductType = useCallback(() => {
    if (selectedProductType) {
      deleteMutation.mutate(selectedProductType.id);
    }
  }, [selectedProductType, deleteMutation]);

  const handleEditClick = useCallback((productType: ProductType) => {
    setSelectedProductType(productType);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((productType: ProductType) => {
    setSelectedProductType(productType);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Filtered product types
  const filteredProductTypes = useMemo(() => {
    if (!productTypes) return [];

    return productTypes.filter((productType) => {
      const matchesSearch = !searchTerm ||
        productType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        productType.categoryName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [productTypes, searchTerm]);

  // Calculate stats
  const productTypeStats = useMemo(() => {
    if (!productTypes) return { total: 0 };

    return {
      total: productTypes.length,
    };
  }, [productTypes]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load product types</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['product-types'] })}
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
          <h1 className="text-2xl font-bold text-gray-900">Product Types</h1>
          <p className="text-gray-600">Manage product types and their categories</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product Type
        </button>
      </div>

      {/* Product Type Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Product Types</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {productTypeStats.total}
              </p>
            </div>
            <Tag className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search product types by name or category..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Types Content */}
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
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProductTypes.map((productType) => (
                    <tr key={productType.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center">
                          <Tag className="w-5 h-5 text-blue-600 mr-3" />
                          <span className="font-medium text-gray-900">{productType.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-gray-900">
                        {productType.categoryName}
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditClick(productType)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit product type"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(productType)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete product type"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Empty State */}
              {filteredProductTypes.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No product types match your search' : 'No product types found'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create your first product type
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Product Type Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Product Type"
        size="lg"
      >
        <ProductTypeForm
          onSubmit={handleCreateProductType}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Product Type Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProductType(null);
        }}
        title="Edit Product Type"
        size="lg"
      >
        <ProductTypeForm
          productType={selectedProductType || undefined}
          onSubmit={handleUpdateProductType}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedProductType(null);
          }}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedProductType(null);
        }}
        onConfirm={handleDeleteProductType}
        title="Delete Product Type"
        message={`Are you sure you want to delete the product type "${selectedProductType?.name}"? This action cannot be undone.`}
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

export default ProductTypes;