import "server-only";

import { createShoppingAssistant } from "@/lib/ai/shopping-assistant";
import { createConfiguredDeepSeekProvider } from "@/services/ai/deepseek-provider";
import { searchAIProducts } from "@/services/ai-product-service";
import { listCategories } from "@/services/product-service";
import type { AIShoppingResponse } from "@/types/ai";

export async function getGroundedShoppingRecommendations(
  message: string,
): Promise<AIShoppingResponse> {
  const assistant = createShoppingAssistant({
    provider: createConfiguredDeepSeekProvider(),
    listAllowedCategories: async () => (await listCategories()).map((category) => category.slug),
    searchProducts: searchAIProducts,
  });

  return assistant(message);
}
