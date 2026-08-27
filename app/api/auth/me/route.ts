import type { NextRequest } from "next/server";
import { apiError, apiSuccess, withApiErrorHandling } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";

export const dynamic = "force-dynamic";

export const GET = withApiErrorHandling(async function getCurrentUser(request: NextRequest) {
  const authentication = await authenticateRequest(request);

  if (!authentication.authenticated) {
    return apiError(authentication.code, authentication.message, authentication.status);
  }

  return apiSuccess({ user: authentication.user });
}, "api.auth.me");
