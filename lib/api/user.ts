import type { NextRequest, NextResponse } from "next/server";
import { apiError, apiInternalError } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { validateCsrfRequest } from "@/lib/auth/csrf";
import type { AuthUser } from "@/types/auth";

export type UserMutationAuthorization =
  { authorized: true; user: AuthUser } | { authorized: false; response: NextResponse };

export async function authorizeUserMutation(
  request: NextRequest,
): Promise<UserMutationAuthorization> {
  try {
    const authentication = await authenticateRequest(request);

    if (!authentication.authenticated) {
      return {
        authorized: false,
        response: apiError(authentication.code, authentication.message, authentication.status),
      };
    }

    if (!(await validateCsrfRequest(request))) {
      return {
        authorized: false,
        response: apiError(
          "INVALID_CSRF_TOKEN",
          "セキュリティトークンが無効または期限切れです。",
          403,
        ),
      };
    }

    return { authorized: true, user: authentication.user };
  } catch (error) {
    return {
      authorized: false,
      response: apiInternalError(error, "api.user.authorize", "ログイン状態を確認できません。"),
    };
  }
}
