import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FolderOpen, Grid, List, Edit, Trash2, CheckCircle, XCircle, Tags, BadgeCheck, Ban } from 'lucide-react';
import { toast } from 'react-toastify';
import { categoryService } from '../services/category';
import { Category, CategoryFormData } from '../types/category';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import CategoryForm from '../components/CategoryForm';
import CategoryTree from '../components/CategoryTree';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomSelect from '../components/CustomSelect';

const Categories: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const queryClient = useQueryClient();

  // Fetch category hierarchy
  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['categories', 'hierarchy'],
    queryFn: categoryService.getHierarchy,
  });

  // Fetch all categories for table view
  const {
    data: allCategories,
    isLoading: isLoadingAll,
  } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: categoryService.getAllCategories,
    enabled: viewMode === 'table',
  });

  // Fetch category statistics
  const { data: stats } = useQuery({
    queryKey: ['categories', 'stats'],
    queryFn: categoryService.getStats,
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreateModalOpen(false);
      toast.success('Category created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      categoryService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsEditModalOpen(false);
      setSelectedCategory(null);
      toast.success('Category updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
      toast.success('Category deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });

  // Handlers
  const handleCreateCategory = useCallback((data: CategoryFormData) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const handleUpdateCategory = useCallback((data: CategoryFormData) => {
    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, data });
    }
  }, [selectedCategory, updateMutation]);

  const handleDeleteCategory = useCallback(() => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
    }
  }, [selectedCategory, deleteMutation]);

  const handleEditClick = useCallback((category: Category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((category: Category) => {
    setSelectedCategory(category);
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

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Filtered categories for table view
  const filteredTableCategories = useMemo(() => {
    if (!allCategories) return [];

    return allCategories.filter((category) => {
      const matchesSearch = !searchTerm ||
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && category.status === 1) ||
        (statusFilter === 'inactive' && category.status === 0);

      return matchesSearch && matchesStatus;
    });
  }, [allCategories, searchTerm, statusFilter]);

  // Paginated categories for table view
  const paginatedCategories = useMemo(() => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTableCategories.slice(startIndex, endIndex);
  }, [filteredTableCategories, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredTableCategories.length / pageSize);

  // Calculate stats from categories
  const categoryStats = useMemo(() => {
    if (!categories) return { total: 0, active: 0, inactive: 0 };
    
    const countCategories = (cats: Category[]): { total: number; active: number; inactive: number } => {
      let total = 0;
      let active = 0;
      let inactive = 0;
      
      cats.forEach(cat => {
        total++;
        if (cat.status === 1) active++;
        else inactive++;
        
        if (cat.children && cat.children.length > 0) {
          const childStats = countCategories(cat.children);
          total += childStats.total;
          active += childStats.active;
          inactive += childStats.inactive;
        }
      });
      
      return { total, active, inactive };
    };
    
    return countCategories(categories);
  }, [categories]);

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
          <p className="text-red-600 mb-2">Failed to load categories</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}
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
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600">Organize your products into hierarchical categories</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Category
        </button>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {categoryStats.total}
              </p>
            </div>
            <Tags className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {categoryStats.active}
              </p>
            </div>
            <BadgeCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">
                {categoryStats.inactive}
              </p>
            </div>
            <Ban className="w-8 h-8 text-gray-600" />
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
          <div className="w-full sm:w-40 md:w-48">
            <div className="block sm:hidden">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
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
                className="text-sm"
              />
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden w-full sm:w-auto">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } flex-1 sm:flex-none flex items-center justify-center`}
            >
              <Grid className="w-4 h-4" />
              <span className="ml-2 sm:hidden">Tree</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } flex-1 sm:flex-none flex items-center justify-center`}
            >
              <List className="w-4 h-4" />
              <span className="ml-2 sm:hidden">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {(isLoading || (viewMode === 'table' && isLoadingAll)) ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <>
            {viewMode === 'tree' ? (
              <div className="p-3 sm:p-4 md:p-6 overflow-x-auto">
                <CategoryTree
                  categories={categories || []}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  searchTerm={searchTerm}
                  statusFilter={statusFilter}
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Category</th>
                        <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900 hidden sm:table-cell">Slug</th>
                        <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900 hidden md:table-cell">Description</th>
                        <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900 hidden lg:table-cell">Sort Order</th>
                        <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedCategories.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center space-x-3">
                              {category.imageUrl && (
                                <img
                                  src={category.imageUrl}
                                  alt={category.name}
                                  className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {category.name}
                                </p>
                                <p className="text-xs text-gray-500 sm:hidden font-mono">
                                  {category.slug}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 sm:px-6 hidden sm:table-cell">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {category.slug}
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-6 hidden md:table-cell">
                            <div className="max-w-xs truncate text-sm text-gray-600" title={category.description}>
                              {category.description || '-'}
                            </div>
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(category.status)}`}
                            >
                              {getStatusText(category.status)}
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-6 hidden lg:table-cell text-sm text-gray-900">
                            {category.sortOrder}
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditClick(category)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit category"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(category)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete category"
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

                {/* Pagination for table view */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalElements={filteredTableCategories.length}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                  />
                )}

                {/* Empty State for table view */}
                {paginatedCategories.length === 0 && !isLoadingAll && (
                  <div className="text-center py-12">
                    <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchTerm || statusFilter !== 'all' ? 'No categories match your filters' : 'No categories found'}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Create your first category
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Create Category Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Category"
        size="lg"
      >
        <CategoryForm
          categories={categories || []}
          onSubmit={handleCreateCategory}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
        }}
        title="Edit Category"
        size="lg"
      >
        <CategoryForm
          category={selectedCategory || undefined}
          categories={categories || []}
          onSubmit={handleUpdateCategory}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedCategory(null);
          }}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${selectedCategory?.name}"? This action cannot be undone and will also delete all subcategories.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Floating Add Button (Mobile) */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors sm:hidden z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Categories;