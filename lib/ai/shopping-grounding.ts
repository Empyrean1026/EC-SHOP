import type { AIRecommendationResult } from "@/lib/validations/ai-shopping";
import { AI_RECOMMENDATION_MAX_COUNT } from "@/lib/validations/ai-shopping";
import type { AIProduct, AIRecommendedProduct } from "@/types/ai";

export function hydrateGroundedRecommendations(
  candidateProducts: readonly AIProduct[],
  recommendation: AIRecommendationResult,
): AIRecommendedProduct[] {
  const candidateById = new Map(candidateProducts.map((product) => [product.id, product]));
  const selectedIds = new Set<string>();
  const products: AIRecommendedProduct[] = [];

  for (const selection of recommendation.recommendations) {
    const product = candidateById.get(selection.productId);

    if (!product || selectedIds.has(product.id)) {
      continue;
    }

    selectedIds.add(product.id);
    products.push({
      ...product,
      recommendationReason: selection.reason,
    });

    if (products.length >= AI_RECOMMENDATION_MAX_COUNT) {
      break;
    }
  }

  return products;
}
