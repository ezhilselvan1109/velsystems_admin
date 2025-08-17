export interface ProductImage {
  id?: string;
  imageUrl: string;
  isPrimary: boolean | null;
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

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: {
    id: string;
    name: string;
    description: string;
    logoUrl: string;
    status: number;
    sortOrder: number;
  };
  productType: {
    id: string;
    name: string;
  };
  price: number;
  stock: number;
  description: string;
  image: ProductImage[];
  specificationGroup: ProductSpecificationGroup[];
}

export interface ProductFormData {
  name: string;
  slug: string;
  brandId: string;
  productTypeId: string;
  price: number;
  stock: number;
  description: string;
  imageUrls: ProductImage[];
  specificationGroups: ProductSpecificationGroup[];
}

export interface ProductUpdateData extends ProductFormData {
  imageUrlIds?: string[];
  specificationGroupIds?: string[];
}

export interface ProductStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface PaginatedProductResponse {
  content: Product[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
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
  numberOfElements: number;
  empty: boolean;
}