import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api/response";
import { clearCsrfCookie, clearSessionCookie } from "@/lib/auth/cookies";
import { validateCsrfRequest } from "@/lib/auth/csrf";

export const POST = withApiErrorHandling(async function logout(request: NextRequest) {
  if (!(await validateCsrfRequest(request))) {
    return apiError("INVALID_CSRF_TOKEN", "セキュリティトークンが無効または期限切れです。", 403);
  }

  const response = apiSuccess({ loggedOut: true });
  clearSessionCookie(response);
  clearCsrfCookie(response);

  return response;
}, "api.auth.logout");
