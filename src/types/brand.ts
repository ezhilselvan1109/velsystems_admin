export interface Brand {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  status: 0 | 1; // 0 = inactive, 1 = active
  sortOrder: number;
}

export interface BrandFormData {
  name: string;
  description: string;
  logoUrl: string;
  status: '0' | '1';
  sortOrder: number;
}

export interface BrandStats {
  totalBrands: number;
  activeBrands: number;
  inactiveBrands: number;
}

export interface PaginatedBrandResponse {
  content: Brand[];
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