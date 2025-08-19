import { apiCall } from '../utils/api';
import { 
  Product, 
  ProductFormData, 
  ProductStats, 
  PaginatedProductResponse,
  ProductFilterParams,
  ProductVariant,
  ProductVariantFormData
} from '../types/product';

export const productService = {
  // Get filtered products with pagination
  getFilteredProducts: (params: ProductFilterParams = {}) => {
    const queryParams = {
      brandId: params.brandId,
      categoryId: params.categoryId,
      keyword: params.keyword,
      status: params.status || '1', // Default to active
      page: params.page || 0,
      size: params.size || 10,
      sortBy: params.sortBy || 'createdAt',
      direction: params.direction || 'desc',
    };
    
    // Remove undefined values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key as keyof typeof queryParams] === undefined) {
        delete queryParams[key as keyof typeof queryParams];
      }
    });

    return apiCall<PaginatedProductResponse>('GET', '/products/filter', null, queryParams);
  },

  // Get all products (non-paginated)
  getAllProducts: () => apiCall<Product[]>('GET', '/products/all'),

  // Get product statistics
  getStats: () => apiCall<ProductStats>('GET', '/products/stats'),

  // Get single product
  getProduct: (id: string) => apiCall<Product>('GET', `/products/${id}`),

  // Create product
  createProduct: (data: ProductFormData) =>
    apiCall<Product>('POST', '/products', data),

  // Update product
  updateProduct: (id: string, data: ProductFormData) =>
    apiCall<Product>('PUT', `/products/${id}`, data),

  // Delete product
  deleteProduct: (id: string) => apiCall<{}>('DELETE', `/products/${id}`),

  // Get product variants
  getProductVariants: (productId: string) =>
    apiCall<ProductVariant[]>('GET', `/products/${productId}/variants`),

  // Create product variant
  createProductVariant: (productId: string, data: ProductVariantFormData) =>
    apiCall<Product>('POST', `/products/${productId}/variants`, data),

  // Update product variant
  updateProductVariant: (variantId: string, data: ProductVariantFormData) =>
    apiCall<ProductVariant>('PUT', `/products/variants/${variantId}`, data),

  // Delete product variant
  deleteProductVariant: (variantId: string) =>
    apiCall<{}>('DELETE', `/products/variants/${variantId}`),
};