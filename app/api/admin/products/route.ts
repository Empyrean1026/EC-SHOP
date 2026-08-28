import type { NextRequest } from "next/server";
import { adminServiceErrorResponse } from "@/lib/api/admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { adminProductListQuerySchema } from "@/lib/validations/admin";
import { getValidationErrors } from "@/lib/validations/errors";
import { listAdminProducts } from "@/services/admin-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authentication = await authenticateRequest(request, "admin");
  if (!authentication.authenticated) {
    return apiError(authentication.code, authentication.message, authentication.status);
  }
  const parsed = adminProductListQuerySchema.safeParse(
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
    return apiSuccess({ ...(await listAdminProducts(parsed.data)), filters: parsed.data });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list products");
  }
}
