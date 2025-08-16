import { apiCall } from '../utils/api';
import { Brand, BrandFormData, BrandStats } from '../types/brand';

export const brandService = {
  // Get all brands
  getBrands: () => apiCall<Brand[]>('GET', '/brands'),

  // Get brand statistics
  getStats: () => apiCall<BrandStats>('GET', '/brands/stats'),

  // Get single brand
  getBrand: (id: string) => apiCall<Brand>('GET', `/brands/${id}`),

  // Create brand
  createBrand: (data: BrandFormData) =>
    apiCall<Brand>('POST', '/brands', {
      ...data,
      status: parseInt(data.status),
    }),

  // Update brand
  updateBrand: (id: string, data: BrandFormData) =>
    apiCall<Brand>('PUT', `/brands/${id}`, {
      ...data,
      status: parseInt(data.status),
    }),

  // Delete brand
  deleteBrand: (id: string) => apiCall<{}>('DELETE', `/brands/${id}`),
};