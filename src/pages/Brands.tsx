import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { brandService } from '../services/brand';
import { Brand, BrandFormData } from '../types/brand';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import BrandForm from '../components/BrandForm';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomSelect from '../components/CustomSelect';

const Brands: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const queryClient = useQueryClient();

  // Fetch brands
  const {
    data: brands,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getBrands,
  });

  // Create brand mutation
  const createMutation = useMutation({
    mutationFn: brandService.createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setIsCreateModalOpen(false);
      toast.success('Brand created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create brand');
    },
  });

  // Update brand mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BrandFormData }) =>
      brandService.updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setIsEditModalOpen(false);
      setSelectedBrand(null);
      toast.success('Brand updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update brand');
    },
  });

  // Delete brand mutation
  const deleteMutation = useMutation({
    mutationFn: brandService.deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setIsDeleteDialogOpen(false);
      setSelectedBrand(null);
      toast.success('Brand deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete brand');
    },
  });

  // Handlers
  const handleCreateBrand = useCallback((data: BrandFormData) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const handleUpdateBrand = useCallback((data: BrandFormData) => {
    if (selectedBrand) {
      updateMutation.mutate({ id: selectedBrand.id, data });
    }
  }, [selectedBrand, updateMutation]);

  const handleDeleteBrand = useCallback(() => {
    if (selectedBrand) {
      deleteMutation.mutate(selectedBrand.id);
    }
  }, [selectedBrand, deleteMutation]);

  const handleEditClick = useCallback((brand: Brand) => {
    setSelectedBrand(brand);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((brand: Brand) => {
    setSelectedBrand(brand);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  }, []);

  const handleStatusFilterChangeCustom = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    if (!brands) return [];

    return brands.filter((brand) => {
      const matchesSearch = !searchTerm ||
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && brand.status === 1) ||
        (statusFilter === 'inactive' && brand.status === 0);

      return matchesSearch && matchesStatus;
    });
  }, [brands, searchTerm, statusFilter]);

  // Calculate stats
  const brandStats = useMemo(() => {
    if (!brands) return { total: 0, active: 0, inactive: 0 };

    return {
      total: brands.length,
      active: brands.filter(brand => brand.status === 1).length,
      inactive: brands.filter(brand => brand.status === 0).length,
    };
  }, [brands]);

  const getStatusColor = useCallback((status: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  }, []);

  const getStatusText = useCallback((status: number) => {
    return status === 1 ? 'Active' : 'Inactive';
  }, []);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load brands</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['brands'] })}
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
          <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
          <p className="text-gray-600">Manage your product brands and manufacturers</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Brand
        </button>
      </div>

      {/* Brand Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Brands</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {brandStats.total}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {brandStats.active}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">
                {brandStats.inactive}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search brands by name or description..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="block sm:hidden">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="hidden sm:block">
              <CustomSelect
                options={statusOptions}
                value={statusFilter}
                onChange={handleStatusFilterChangeCustom}
                placeholder="Select status"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Brands Content */}
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
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Brand</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Description</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Logo</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">SortOrder</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBrands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 sm:px-6">
                        {brand.name}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-gray-900">
                        <div className="max-w-xs truncate" title={brand.description}>
                          {brand.description}
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        {brand.logoUrl ? (
                          <img
                            src={brand.logoUrl}
                            alt={brand.name}
                            className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-gray-50 p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(brand.status)}`}
                        >
                          {getStatusText(brand.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        {brand.sortOrder}
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditClick(brand)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit coupon"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(brand)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete coupon"
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
              {filteredBrands.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? 'No brands match your filters' : 'No brands found'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create your first brand
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Brand Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Brand"
        size="lg"
      >
        <BrandForm
          onSubmit={handleCreateBrand}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Brand Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBrand(null);
        }}
        title="Edit Brand"
        size="lg"
      >
        <BrandForm
          brand={selectedBrand || undefined}
          onSubmit={handleUpdateBrand}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedBrand(null);
          }}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedBrand(null);
        }}
        onConfirm={handleDeleteBrand}
        title="Delete Brand"
        message={`Are you sure you want to delete the brand "${selectedBrand?.name}"? This action cannot be undone.`}
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

export default Brands;