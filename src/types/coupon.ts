export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 0 | 1; // 0 = percentage, 1 = fixed amount
  value: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
  maxUses: number;
  usedCount: number;
}

export interface CouponStats {
  activeCount: number;
  totalUsedCount: number;
  expiredCount: number;
}

export interface CouponFormData {
  code: string;
  description: string;
  type: '0' | '1';
  value: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
  maxUses: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}