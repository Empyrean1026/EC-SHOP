import type { NextRequest } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { aiProductSearchCriteriaSchema } from "@/lib/validations/ai-product-search";
import { getValidationErrors } from "@/lib/validations/errors";
import { searchAIProducts } from "@/services/ai-product-service";

export const dynamic = "force-dynamic";
const AI_PRODUCT_SEARCH_BODY_LIMIT_BYTES = 8 * 1024;

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request, AI_PRODUCT_SEARCH_BODY_LIMIT_BYTES);

  if (!body.success) {
    return apiError(body.code, body.message, body.status);
  }

  const parsed = aiProductSearchCriteriaSchema.safeParse(body.data);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "商品検索条件が正しくありません。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    return apiSuccess(await searchAIProducts(parsed.data));
  } catch (error) {
    return apiInternalError(error, "api.ai.products.search", "商品を検索できません。");
  }
}
