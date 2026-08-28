import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";

export const dynamic = "force-dynamic";

export const GET = withApiErrorHandling(async function pingAdmin(request: NextRequest) {
  const authentication = await authenticateRequest(request, "admin");

  if (!authentication.authenticated) {
    return apiError(authentication.code, authentication.message, authentication.status);
  }

  return apiSuccess({
    message: "管理者権限を確認しました。",
    user: authentication.user,
  });
}, "api.admin.ping");
