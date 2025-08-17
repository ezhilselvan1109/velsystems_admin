import { apiCall } from '../utils/api';
import { Product, ProductFormData, ProductUpdateData, ProductStats, PaginatedProductResponse } from '../types/product';

export const productService = {
  // Get paginated products
  getProducts: (
    page: number = 0,
    size: number = 10,
    sortBy: string = 'createdAt',
    sortDir: string = 'desc'
  ) =>
    apiCall<PaginatedProductResponse>('GET', '/products/paginated', null, {
      page,
      size,
      sortBy,
      sortDir,
    }),

  // Get product statistics
  getStats: () => apiCall<ProductStats>('GET', '/products/stats'),

  // Get single product
  getProduct: (id: string) => apiCall<Product>('GET', `/products/${id}`),

  // Create product
  createProduct: (data: ProductFormData) =>
    apiCall<Product>('POST', '/products', data),

  // Update product
  updateProduct: (id: string, data: ProductUpdateData) =>
    apiCall<Product>('PUT', `/products/${id}`, data),

  // Delete product
  deleteProduct: (id: string) => apiCall<{}>('DELETE', `/products/${id}`),
};