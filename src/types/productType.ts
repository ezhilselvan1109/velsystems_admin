export interface ProductType {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
}

export interface ProductTypeFormData {
  name: string;
  categoryId: string;
}

export interface ProductTypeStats {
  totalProductTypes: number;
  activeProductTypes: number;
  inactiveProductTypes: number;
}