import type { ProductSearchCriteria } from "@/lib/validations/ai-product-search";
import type { ProductListQuery } from "@/lib/validations/product";

export const AI_PRODUCT_SEARCH_SORT = "sales_desc" as const;

export function toProductListQuery(criteria: ProductSearchCriteria): ProductListQuery {
  return {
    q: criteria.query,
    category: criteria.category,
    page: 1,
    limit: criteria.limit,
    minPrice: criteria.minPrice,
    maxPrice: criteria.maxPrice,
    currency: undefined,
    inStock: criteria.inStock,
    sort: AI_PRODUCT_SEARCH_SORT,
  };
}
