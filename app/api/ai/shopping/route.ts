import type { NextRequest } from "next/server";
import { isAIServiceError } from "@/lib/ai/errors";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { aiShoppingRequestSchema } from "@/lib/validations/ai-shopping";
import { getValidationErrors } from "@/lib/validations/errors";
import { getGroundedShoppingRecommendations } from "@/services/ai/shopping-assistant";

export const dynamic = "force-dynamic";
const AI_SHOPPING_BODY_LIMIT_BYTES = 4 * 1024;

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request, AI_SHOPPING_BODY_LIMIT_BYTES);

  if (!body.success) {
    return apiError(body.code, body.message, body.status);
  }

  const parsed = aiShoppingRequestSchema.safeParse(body.data);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "メッセージの入力内容をご確認ください。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    return apiSuccess(await getGroundedShoppingRecommendations(parsed.data.message));
  } catch (error) {
    if (isAIServiceError(error)) {
      return apiInternalError(
        error,
        "api.ai.shopping.provider",
        "AIアシスタントへの接続に失敗しました。しばらくしてからもう一度お試しください。",
        "AI_PROVIDER_UNAVAILABLE",
        503,
      );
    }

    return apiInternalError(
      error,
      "api.ai.shopping",
      "商品情報を確認できませんでした。しばらくしてからもう一度お試しください。",
    );
  }
}
