import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
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
      "搜索建议参数无效。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    return apiSuccess(await suggestProducts(parsed.data));
  } catch (error) {
    console.error("[api/search/suggestions] Unable to load suggestions", error);
    return apiError("INTERNAL_ERROR", "暂时无法加载搜索建议。", 500);
  }
}
