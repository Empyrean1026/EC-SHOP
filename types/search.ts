import type { CatalogProduct, PaginationMeta } from "@/types/product";

export type SearchMode = "full_text" | "substring" | "fuzzy" | "none";

export type ProductSearchResult = {
  items: CatalogProduct[];
  pagination: PaginationMeta;
  query: string;
  mode: SearchMode;
};

export type SearchSuggestion = {
  id: string;
  name: string;
  slug: string;
  categoryName: string | null;
  price: number;
  currency: CatalogProduct["currency"];
  stock: number;
};

export type SearchSuggestionsResult = {
  items: SearchSuggestion[];
  query: string;
  mode: Exclude<SearchMode, "full_text">;
};
