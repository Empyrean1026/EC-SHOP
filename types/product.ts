import type { CurrencyCode } from "@/models";

export type ProductCategorySummary = {
  id: string;
  name: string;
  slug: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  category: ProductCategorySummary | null;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  salesCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogCategory = ProductCategorySummary & {
  description: string | null;
  image: string | null;
  parentCategoryId: string | null;
  productCount: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ProductListResult = {
  items: CatalogProduct[];
  pagination: PaginationMeta;
};
