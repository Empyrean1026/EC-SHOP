import { z } from "zod";
import { SLUG_PATTERN } from "@/models/validators";

export const AI_PRODUCT_SEARCH_DEFAULT_LIMIT = 5;
export const AI_PRODUCT_SEARCH_MAX_LIMIT = 10;

export const aiProductSearchCriteriaSchema = z
  .object({
    query: z.string().trim().min(1).max(100).optional(),
    category: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(SLUG_PATTERN, "カテゴリーには有効な Slug を指定してください")
      .optional(),
    minPrice: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
    maxPrice: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
    inStock: z.boolean().default(true),
    limit: z
      .number()
      .int()
      .min(1)
      .max(AI_PRODUCT_SEARCH_MAX_LIMIT)
      .default(AI_PRODUCT_SEARCH_DEFAULT_LIMIT),
  })
  .strict()
  .refine(
    (value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      value.minPrice <= value.maxPrice,
    {
      message: "最低価格は最高価格以下にしてください",
      path: ["minPrice"],
    },
  );

export type ProductSearchCriteria = z.infer<typeof aiProductSearchCriteriaSchema>;
