import { apiCall } from '../utils/api';
import { Coupon, CouponStats, CouponFormData, PaginatedResponse } from '../types/coupon';

export const couponService = {
  // Get coupon statistics
  getStats: () => apiCall<CouponStats>('GET', '/coupons/stats'),

  // Get paginated coupons
  getCoupons: (page: number = 0, size: number = 10) =>
    apiCall<PaginatedResponse<Coupon>>('GET', '/coupons', null, { page, size }),

  // Get single coupon
  getCoupon: (id: string) => apiCall<Coupon>('GET', `/coupons/${id}`),

  // Create coupon
  createCoupon: (data: CouponFormData) =>
    apiCall<Coupon>('POST', '/coupons', {
      ...data,
      type: data.type,
      usedCount: 0,
    }),

  // Update coupon
  updateCoupon: (id: string, data: CouponFormData) =>
    apiCall<Coupon>('PUT', `/coupons/${id}`, {
      ...data,
      type: data.type,
    }),

  // Delete coupon
  deleteCoupon: (id: string) => apiCall<{}>('DELETE', `/coupons/${id}`),
};