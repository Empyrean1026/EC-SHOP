import { hydrateGroundedRecommendations } from "@/lib/ai/shopping-grounding";
import type { AIProvider } from "@/lib/ai/provider";
import {
  AI_RECOMMENDATION_MAX_COUNT,
  normalizeShoppingIntent,
  validateAIRecommendation,
} from "@/lib/validations/ai-shopping";
import type { ProductSearchCriteria } from "@/lib/validations/ai-product-search";
import type { AIProductSearchResult, AIShoppingResponse } from "@/types/ai";

export const AI_SHOPPING_SUCCESS_MESSAGE = "ご希望に合う商品を選びました。";
export const AI_SHOPPING_NO_RESULTS_MESSAGE =
  "条件に合う商品が見つかりませんでした。予算や条件を変更して、もう一度お試しください。";
export const AI_SHOPPING_NO_VALID_RECOMMENDATIONS_MESSAGE =
  "おすすめ商品を確認できませんでした。条件を変更して、もう一度お試しください。";

export type ShoppingAssistantDependencies = {
  provider: AIProvider;
  listAllowedCategories: () => Promise<string[]>;
  searchProducts: (criteria: ProductSearchCriteria) => Promise<AIProductSearchResult>;
};

export function createShoppingAssistant(dependencies: ShoppingAssistantDependencies) {
  return async function recommendProducts(message: string): Promise<AIShoppingResponse> {
    const allowedCategories = await dependencies.listAllowedCategories();
    const rawIntent = await dependencies.provider.extractShoppingIntent({
      message,
      allowedCategories,
    });
    const criteria = normalizeShoppingIntent(rawIntent, allowedCategories);
    const { products: candidateProducts } = await dependencies.searchProducts(criteria);

    if (candidateProducts.length === 0) {
      return {
        message: AI_SHOPPING_NO_RESULTS_MESSAGE,
        products: [],
      };
    }

    const rawRecommendation = await dependencies.provider.generateProductRecommendation({
      message,
      candidateProducts,
      maxRecommendations: Math.min(AI_RECOMMENDATION_MAX_COUNT, candidateProducts.length),
    });
    const recommendation = validateAIRecommendation(rawRecommendation);
    const products = hydrateGroundedRecommendations(candidateProducts, recommendation);

    return {
      message:
        products.length > 0
          ? AI_SHOPPING_SUCCESS_MESSAGE
          : AI_SHOPPING_NO_VALID_RECOMMENDATIONS_MESSAGE,
      products,
    };
  };
}
