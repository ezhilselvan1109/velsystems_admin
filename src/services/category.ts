import { apiCall } from '../utils/api';
import { Category, CategoryFormData, CategoryStats } from '../types/category';

export const categoryService = {
  // Get category hierarchy
  getHierarchy: () => apiCall<Category[]>('GET', '/categories/hierarchy'),

  // Get category statistics
  getStats: () => apiCall<CategoryStats>('GET', '/categories/stats'),

  // Get single category
  getCategory: (id: string) => apiCall<Category>('GET', `/categories/${id}`),

  // Create category
  createCategory: (data: CategoryFormData) =>
    apiCall<Category>('POST', '/categories', {
      ...data,
      status: parseInt(data.status),
    }),

  // Update category
  updateCategory: (id: string, data: CategoryFormData) =>
    apiCall<Category>('PUT', `/categories/${id}`, {
      ...data,
      status: parseInt(data.status),
    }),

  // Delete category
  deleteCategory: (id: string) => apiCall<{}>('DELETE', `/categories/${id}`),
};