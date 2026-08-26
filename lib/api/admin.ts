import type { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { validateCsrfRequest } from "@/lib/auth/csrf";

export async function authorizeAdminMutation(request: NextRequest): Promise<NextResponse | null> {
  try {
    const authentication = await authenticateRequest(request, "admin");

    if (!authentication.authenticated) {
      return apiError(authentication.code, authentication.message, authentication.status);
    }

    if (!(await validateCsrfRequest(request))) {
      return apiError("INVALID_CSRF_TOKEN", "安全令牌无效或已过期。", 403);
    }

    return null;
  } catch (error) {
    console.error("[api/admin] Authorization failed", error);
    return apiError("INTERNAL_ERROR", "暂时无法验证管理员权限。", 500);
  }
}
