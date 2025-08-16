export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  status: 0 | 1; // 0 = inactive, 1 = active
  sortOrder: number;
  children: Category[];
  parentId?: string;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  status: '0' | '1';
  sortOrder: number;
  parentId?: string;
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
}