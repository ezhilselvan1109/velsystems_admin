import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Edit, Trash2, FolderOpen, Folder } from 'lucide-react';
import { Category } from '../types/category';

interface CategoryTreeProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  searchTerm?: string;
  statusFilter?: string;
}

interface CategoryNodeProps {
  category: Category;
  level: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  searchTerm?: string;
  statusFilter?: string;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level,
  onEdit,
  onDelete,
  searchTerm,
  statusFilter,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleEdit = useCallback(() => {
    onEdit(category);
  }, [category, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(category);
  }, [category, onDelete]);

  // Filter logic
  const matchesSearch = !searchTerm || 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesStatus = !statusFilter || 
    statusFilter === 'all' || 
    (statusFilter === 'active' && category.status === 1) ||
    (statusFilter === 'inactive' && category.status === 0);

  const hasVisibleChildren = category.children?.some(child => {
    const childMatchesSearch = !searchTerm || 
      child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const childMatchesStatus = !statusFilter || 
      statusFilter === 'all' || 
      (statusFilter === 'active' && child.status === 1) ||
      (statusFilter === 'inactive' && child.status === 0);
    return childMatchesSearch && childMatchesStatus;
  });

  const shouldShow = matchesSearch && matchesStatus;

  if (!shouldShow && !hasVisibleChildren) {
    return null;
  }

  const getStatusColor = (status: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: number) => {
    return status === 1 ? 'Active' : 'Inactive';
  };

  return (
    <div className="select-none">
      {/* Category Card */}
      <div
        className={`
          bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200
          ${level > 0 ? 'ml-6 border-l-4 border-l-blue-200' : ''}
        `}
        style={{ marginLeft: level > 0 ? `${level * 24}px` : '0' }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {/* Expand/Collapse Button */}
              {category.children && category.children.length > 0 && (
                <button
                  onClick={toggleExpanded}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              )}

              {/* Category Icon */}
              <div className="flex-shrink-0">
                {category.children && category.children.length > 0 ? (
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                ) : (
                  <Folder className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {/* Category Image */}
              {category.imageUrl && (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}

              {/* Category Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {category.name}
                  </h3>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(category.status)}`}
                  >
                    {getStatusText(category.status)}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {category.slug}
                  </span>
                  <span>Sort: {category.sortOrder}</span>
                  {category.children && category.children.length > 0 && (
                    <span>{category.children.length} subcategories</span>
                  )}
                </div>
                {category.description && (
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {category.description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-4">
              <button
                onClick={handleEdit}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit category"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {isExpanded && category.children && category.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {category.children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onEdit,
  onDelete,
  searchTerm,
  statusFilter,
}) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No categories found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          level={0}
          onEdit={onEdit}
          onDelete={onDelete}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
        />
      ))}
    </div>
  );
};

export default CategoryTree;