import { z } from "zod";
import { AIOutputValidationError } from "@/lib/ai/errors";
import {
  AI_PRODUCT_SEARCH_MAX_LIMIT,
  aiProductSearchCriteriaSchema,
  type ProductSearchCriteria,
} from "@/lib/validations/ai-product-search";

export const AI_SHOPPING_MESSAGE_MAX_LENGTH = 1000;
export const AI_RECOMMENDATION_MAX_COUNT = 3;

export const aiShoppingRequestSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, "メッセージを入力してください")
      .max(AI_SHOPPING_MESSAGE_MAX_LENGTH, "メッセージが長すぎます"),
  })
  .strict();

const rawShoppingIntentSchema = z
  .object({
    query: z.string().max(100).optional(),
    category: z.string().max(120).optional(),
    minPrice: z.number().finite().optional(),
    maxPrice: z.number().finite().optional(),
    inStock: z.boolean().optional(),
    limit: z.number().finite().optional(),
  })
  .strict();

export const aiRecommendationResultSchema = z
  .object({
    message: z.string().trim().min(1).max(300),
    recommendations: z
      .array(
        z
          .object({
            productId: z.string().trim().min(1).max(200),
            reason: z.string().trim().min(1).max(300),
          })
          .strict(),
      )
      .max(AI_PRODUCT_SEARCH_MAX_LIMIT),
  })
  .strict();

export type AIRecommendationResult = z.infer<typeof aiRecommendationResultSchema>;

export function normalizeShoppingIntent(
  value: unknown,
  allowedCategories: readonly string[],
): ProductSearchCriteria {
  const raw = rawShoppingIntentSchema.safeParse(value);

  if (!raw.success) {
    throw new AIOutputValidationError("intent");
  }

  const query = raw.data.query?.trim();
  const category = raw.data.category?.trim();
  const normalized = aiProductSearchCriteriaSchema.safeParse({
    ...(query ? { query } : {}),
    ...(category && allowedCategories.includes(category) ? { category } : {}),
    ...(raw.data.minPrice !== undefined ? { minPrice: raw.data.minPrice } : {}),
    ...(raw.data.maxPrice !== undefined ? { maxPrice: raw.data.maxPrice } : {}),
    ...(raw.data.inStock !== undefined ? { inStock: raw.data.inStock } : {}),
    ...(raw.data.limit !== undefined ? { limit: raw.data.limit } : {}),
  });

  if (!normalized.success) {
    throw new AIOutputValidationError("intent");
  }

  return normalized.data;
}

export function validateAIRecommendation(value: unknown): AIRecommendationResult {
  const parsed = aiRecommendationResultSchema.safeParse(value);

  if (!parsed.success) {
    throw new AIOutputValidationError("recommendation");
  }

  return parsed.data;
}
