import type { NextRequest, NextResponse } from "next/server";
import { apiError, apiInternalError } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { validateCsrfRequest } from "@/lib/auth/csrf";
import {
  AdminOrderNotFoundError,
  ConcurrentOrderUpdateError,
  InvalidOrderTransitionError,
} from "@/services/admin-service";

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
    return apiInternalError(error, "api.admin.authorize", "暂时无法验证管理员权限。");
  }
}

export function adminServiceErrorResponse(error: unknown, context: string): NextResponse {
  if (error instanceof AdminOrderNotFoundError) {
    return apiError("ORDER_NOT_FOUND", "订单不存在。", 404);
  }
  if (error instanceof InvalidOrderTransitionError) {
    return apiError("INVALID_ORDER_TRANSITION", "该订单不能进入所选状态。", 409);
  }
  if (error instanceof ConcurrentOrderUpdateError) {
    return apiError("ORDER_CHANGED", "订单已被其他操作更新，请刷新后重试。", 409);
  }

  return apiInternalError(error, `api.admin.${context}`, "管理员服务暂时不可用。");
}
