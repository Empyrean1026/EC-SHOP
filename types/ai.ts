import type { CurrencyCode } from "@/models";

export type AIProductCategory = {
  name: string;
  slug: string;
};

export type AIProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: AIProductCategory | null;
  price: number;
  currency: CurrencyCode;
  stock: number;
  image: string | null;
  url: string;
};

export type AIProductSearchResult = {
  products: AIProduct[];
};

export type AIRecommendedProduct = AIProduct & {
  recommendationReason: string;
};

export type AIShoppingResponse = {
  message: string;
  products: AIRecommendedProduct[];
};
