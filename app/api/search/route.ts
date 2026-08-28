import type { NextRequest } from "next/server";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { getValidationErrors } from "@/lib/validations/errors";
import { searchQuerySchema } from "@/lib/validations/search";
import { searchProducts } from "@/services/search-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsed = searchQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "検索条件が正しくありません。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    const result = await searchProducts(parsed.data);
    return apiSuccess({ ...result, filters: parsed.data });
  } catch (error) {
    return apiInternalError(error, "api.search.results", "商品を検索できません。");
  }
}
