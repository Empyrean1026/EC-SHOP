import type { NextRequest } from "next/server";
import { adminServiceErrorResponse } from "@/lib/api/admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { adminOrderListQuerySchema } from "@/lib/validations/admin";
import { getValidationErrors } from "@/lib/validations/errors";
import { listAdminOrders } from "@/services/admin-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authentication = await authenticateRequest(request, "admin");
  if (!authentication.authenticated) {
    return apiError(authentication.code, authentication.message, authentication.status);
  }
  const parsed = adminOrderListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "查询参数无效。", 422, getValidationErrors(parsed.error));
  }
  try {
    return apiSuccess({ ...(await listAdminOrders(parsed.data)), filters: parsed.data });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list orders");
  }
}
