export interface ProductImage {
  id?: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder?: number;
}

export interface ProductSpecification {
  id?: string;
  attributeName: string;
  attributeValue: string;
}

export interface ProductSpecificationGroup {
  id?: string;
  name: string;
  specifications: ProductSpecification[];
}

export interface ProductOption {
  id?: string;
  name: string;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  id?: string;
  value: string;
}

export interface ProductVariantOption {
  optionId: string;
  optionName: string;
  optionValue: string;
}

export interface ProductVariant {
  id?: string;
  sku: string;
  price: number;
  options: ProductVariantOption[];
  images: ProductImage[];
}

export interface ProductBrand {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  status: string;
  sortOrder: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  status: string;
  sortOrder: number;
  children: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: ProductBrand;
  category: ProductCategory;
  status: string;
  options: ProductOption[];
  specificationGroups: ProductSpecificationGroup[];
  variants: ProductVariant[];
}

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  brandId: string;
  categoryId: string;
  options: ProductOption[];
  specificationGroups: ProductSpecificationGroup[];
}

export interface ProductVariantFormData {
  id?: string;
  sku: string;
  price: number;
  options: {
    id: string;
    optionValueId: string;
  }[];
  images: ProductImage[];
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
}

export interface ProductFilterParams {
  brandId?: string;
  categoryId?: string;
  keyword?: string;
  status?: '0' | '1' | '2';
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

export interface PaginatedProductResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  last: boolean;
  pageable: {
    offset: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    pageSize: number;
    paged: boolean;
    pageNumber: number;
    unpaged: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}