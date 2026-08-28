import type { NextRequest } from "next/server";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { getValidationErrors } from "@/lib/validations/errors";
import { suggestionQuerySchema } from "@/lib/validations/search";
import { suggestProducts } from "@/services/search-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsed = suggestionQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "検索候補の条件が正しくありません。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    return apiSuccess(await suggestProducts(parsed.data));
  } catch (error) {
    return apiInternalError(error, "api.search.suggestions", "検索候補を読み込めません。");
  }
}
