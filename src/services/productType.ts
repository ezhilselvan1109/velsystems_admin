import { apiCall } from '../utils/api';
import { ProductType, ProductTypeFormData, ProductTypeStats } from '../types/productType';

export const productTypeService = {
  // Get all product types
  getProductTypes: () => apiCall<ProductType[]>('GET', '/product-types'),

  // Get product type statistics
  getStats: () => apiCall<ProductTypeStats>('GET', '/product-types/stats'),

  // Get single product type
  getProductType: (id: string) => apiCall<ProductType>('GET', `/product-types/${id}`),

  // Create product type
  createProductType: (data: ProductTypeFormData) =>
    apiCall<ProductType>('POST', '/product-types', data),

  // Update product type
  updateProductType: (id: string, data: ProductTypeFormData) =>
    apiCall<ProductType>('PUT', `/product-types/${id}`, data),

  // Delete product type
  deleteProductType: (id: string) => apiCall<{}>('DELETE', `/product-types/${id}`),
};