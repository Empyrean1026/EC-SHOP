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
      return apiError("INVALID_CSRF_TOKEN", "セキュリティトークンが無効または期限切れです。", 403);
    }

    return null;
  } catch (error) {
    return apiInternalError(error, "api.admin.authorize", "管理者権限を確認できません。");
  }
}

export function adminServiceErrorResponse(error: unknown, context: string): NextResponse {
  if (error instanceof AdminOrderNotFoundError) {
    return apiError("ORDER_NOT_FOUND", "注文が見つかりません。", 404);
  }
  if (error instanceof InvalidOrderTransitionError) {
    return apiError(
      "INVALID_ORDER_TRANSITION",
      "この注文は選択したステータスに変更できません。",
      409,
    );
  }
  if (error instanceof ConcurrentOrderUpdateError) {
    return apiError(
      "ORDER_CHANGED",
      "注文内容が別の操作で更新されました。ページを再読み込みしてお試しください。",
      409,
    );
  }

  return apiInternalError(
    error,
    `api.admin.${context}`,
    "管理者サービスを一時的に利用できません。",
  );
}
