import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, Percent, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { couponService } from '../services/coupon';
import { Coupon, CouponFormData } from '../types/coupon';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import CouponForm from '../components/CouponForm';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomSelect from '../components/CustomSelect';

const Coupons: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const queryClient = useQueryClient();

  // Fetch coupon statistics
  const { data: stats } = useQuery({
    queryKey: ['coupons', 'stats'],
    queryFn: couponService.getStats,
  });

  // Fetch coupons with pagination
  const {
    data: couponsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['coupons', currentPage, pageSize],
    queryFn: () => couponService.getCoupons(currentPage, pageSize),
  });

  // Create coupon mutation
  const createMutation = useMutation({
    mutationFn: couponService.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsCreateModalOpen(false);
      toast.success('Coupon created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create coupon');
    },
  });

  // Update coupon mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CouponFormData }) =>
      couponService.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsEditModalOpen(false);
      setSelectedCoupon(null);
      toast.success('Coupon updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update coupon');
    },
  });

  // Delete coupon mutation
  const deleteMutation = useMutation({
    mutationFn: couponService.deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsDeleteDialogOpen(false);
      setSelectedCoupon(null);
      toast.success('Coupon deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete coupon');
    },
  });

  // Handlers
  const handleCreateCoupon = useCallback((data: CouponFormData) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const handleUpdateCoupon = useCallback((data: CouponFormData) => {
    if (selectedCoupon) {
      updateMutation.mutate({ id: selectedCoupon.id, data });
    }
  }, [selectedCoupon, updateMutation]);

  const handleDeleteCoupon = useCallback(() => {
    if (selectedCoupon) {
      deleteMutation.mutate(selectedCoupon.id);
    }
  }, [selectedCoupon, deleteMutation]);

  const handleEditClick = useCallback((coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsDeleteDialogOpen(true);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
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

  // Filtered coupons (client-side filtering for search)
  const filteredCoupons = useMemo(() => {
    const coupons = couponsData?.content || [];
    if (!coupons.length) return [];

    return coupons.filter((coupon) => {
      const matchesSearch =
        !searchTerm ||
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.description.toLowerCase().includes(searchTerm.toLowerCase());

      const now = new Date();
      const endDate = new Date(coupon.endsAt);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && coupon.active && endDate >= now) ||
        (statusFilter === 'inactive' && !coupon.active) ||
        (statusFilter === 'expired' && endDate < now);

      return matchesSearch && matchesStatus;
    });
  }, [couponsData?.content, searchTerm, statusFilter]);

  // Utility functions
  const getStatusColor = useCallback((coupon: Coupon) => {
    const now = new Date();
    const endDate = new Date(coupon.endsAt);

    if (!coupon.active) {
      return 'bg-gray-100 text-gray-800';
    }
    if (endDate < now) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-green-100 text-green-800';
  }, []);

  const getStatusText = useCallback((coupon: Coupon) => {
    const now = new Date();
    const endDate = new Date(coupon.endsAt);

    if (!coupon.active) {
      return 'Inactive';
    }
    if (endDate < now) {
      return 'Expired';
    }
    return 'Active';
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const formatDiscount = useCallback((coupon: Coupon) => {
    return coupon.type === 0 ? `${coupon.value}%` : `₹${coupon.value}`;
  }, []);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'expired', label: 'Expired' },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load coupons</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['coupons'] })}
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
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-600">Create and manage discount coupons</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </button>
      </div>

      {/* Coupon Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Coupons</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats?.activeCount || 0}
              </p>
            </div>
            <Percent className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Used</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats?.totalUsedCount || 0}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats?.expiredCount || 0}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search categories by name or slug..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
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
                <option value="expired">Expired</option>
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

      {/* Coupons Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Code</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900 hidden sm:table-cell">Description</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Discount</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900 hidden md:table-cell">Valid Period</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900 hidden lg:table-cell">Usage</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 sm:px-6">
                        <span className="font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-gray-900 hidden sm:table-cell">
                        <div className="max-w-xs truncate" title={coupon.description}>
                          {coupon.description}
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span className="font-medium text-gray-900">{formatDiscount(coupon)}</span>
                        <span className="text-sm text-gray-500 ml-1 block sm:inline">
                          ({coupon.type === 0 ? 'Percentage' : 'Fixed'})
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-gray-900 hidden md:table-cell">
                        <div className="text-sm">
                          <div>{formatDate(coupon.startsAt)}</div>
                          <div className="text-gray-500">to {formatDate(coupon.endsAt)}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 hidden lg:table-cell">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {coupon.usedCount} / {coupon.maxUses}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(coupon)}`}
                        >
                          {getStatusText(coupon)}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditClick(coupon)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit coupon"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(coupon)}
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
            </div>

            {/* Pagination */}
            {couponsData && (
              <Pagination
                currentPage={couponsData.number}
                totalPages={couponsData.totalPages}
                totalElements={couponsData.totalElements}
                pageSize={couponsData.size}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>

      {/* Create Coupon Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Coupon"
        size="lg"
      >
        <CouponForm
          onSubmit={handleCreateCoupon}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Coupon Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCoupon(null);
        }}
        title="Edit Coupon"
        size="lg"
      >
        <CouponForm
          coupon={selectedCoupon || undefined}
          onSubmit={handleUpdateCoupon}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedCoupon(null);
          }}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedCoupon(null);
        }}
        onConfirm={handleDeleteCoupon}
        title="Delete Coupon"
        message={`Are you sure you want to delete the coupon "${selectedCoupon?.code}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Coupons;