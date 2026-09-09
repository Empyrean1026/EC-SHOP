import "server-only";

import { toAIProduct } from "@/lib/ai/product-dto";
import { toProductListQuery } from "@/lib/ai/product-search";
import type { ProductSearchCriteria } from "@/lib/validations/ai-product-search";
import { listProducts } from "@/services/product-service";
import type { AIProductSearchResult } from "@/types/ai";

export async function searchAIProducts(
  criteria: ProductSearchCriteria,
): Promise<AIProductSearchResult> {
  const result = await listProducts(toProductListQuery(criteria));

  return {
    products: result.items.map(toAIProduct),
  };
}
