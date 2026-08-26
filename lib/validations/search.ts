import { z } from "zod";
import {
  SEARCH_MAX_PAGE_SIZE,
  SEARCH_MAX_SUGGESTION_LIMIT,
  SEARCH_PAGE_SIZE,
  SEARCH_SORT_VALUES,
  SEARCH_SUGGESTION_LIMIT,
} from "@/lib/search/constants";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;
const booleanString = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export const searchQuerySchema = z
  .object({
    q: z.preprocess(emptyToUndefined, z.string().trim().min(2).max(100).optional()),
    category: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(120).optional()),
    page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100_000).default(1)),
    limit: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).max(SEARCH_MAX_PAGE_SIZE).default(SEARCH_PAGE_SIZE),
    ),
    inStock: z.preprocess(emptyToUndefined, booleanString),
    fuzzy: z.preprocess(emptyToUndefined, booleanString.default(true)),
    sort: z.preprocess(emptyToUndefined, z.enum(SEARCH_SORT_VALUES).default("relevance")),
  })
  .strict();

export const suggestionQuerySchema = z
  .object({
    q: z.string().trim().min(2).max(50),
    limit: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number()
        .int()
        .min(1)
        .max(SEARCH_MAX_SUGGESTION_LIMIT)
        .default(SEARCH_SUGGESTION_LIMIT),
    ),
  })
  .strict();

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SuggestionQuery = z.infer<typeof suggestionQuerySchema>;
