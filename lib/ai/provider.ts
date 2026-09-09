import type { AIProduct } from "@/types/ai";

export type ShoppingIntentProviderInput = {
  message: string;
  allowedCategories: string[];
};

export type ProductRecommendationProviderInput = {
  message: string;
  candidateProducts: AIProduct[];
  maxRecommendations: number;
};

export interface AIProvider {
  extractShoppingIntent(input: ShoppingIntentProviderInput): Promise<unknown>;
  generateProductRecommendation(input: ProductRecommendationProviderInput): Promise<unknown>;
}

export type AIProviderTelemetry = {
  requestId: string;
  provider: "deepseek";
  model: string;
  phase: "intent" | "recommendation";
  latencyMs: number;
  retryCount: number;
  outcome: "success" | "failure";
  errorCategory?: string;
  httpStatus?: number;
};
