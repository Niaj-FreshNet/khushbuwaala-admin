// Category-related types
export interface Category {
  id: string;
  categoryName: string;
  imageUrl?: string;
  sizes: string[];
  unit: string;
  specification: 'male' | 'female' | 'unisex';
  published: boolean;
  createdAt?: string;
  // how many products use it (admin list)
  _count?: { Product?: number };
}

export interface CategoryFormValues {
  categoryName: string;
  sizes: string[];
  unit: string;
  specification: 'male' | 'female' | 'unisex';
  published: boolean;
  imageUrl?: string;
}

export interface CategoryApiResponse {
  data: {
    data: Category[];
    meta: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

