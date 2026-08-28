import type { NextRequest } from "next/server";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/request";
import { setSessionCookie } from "@/lib/auth/cookies";
import { validateCsrfRequest } from "@/lib/auth/csrf";
import { toAuthUser } from "@/lib/auth/dto";
import { signSessionToken } from "@/lib/auth/jwt";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth/password";
import { clearAuthAttempts, consumeAuthAttempt } from "@/lib/auth/rate-limit";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models";
import { loginSchema } from "@/lib/validations/auth";
import { getValidationErrors } from "@/lib/validations/errors";

export async function POST(request: NextRequest) {
  if (!(await validateCsrfRequest(request))) {
    return apiError("INVALID_CSRF_TOKEN", "セキュリティトークンが無効または期限切れです。", 403);
  }

  const rateLimit = await consumeAuthAttempt(request, "login");

  if (!rateLimit.allowed) {
    const response = apiError(
      "RATE_LIMITED",
      "認証リクエストが多すぎます。しばらくしてからお試しください。",
      429,
    );
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request);

  if (!body.success) {
    return apiError(body.code, body.message, body.status);
  }

  const parsed = loginSchema.safeParse(body.data);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "入力内容をご確認ください。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    await connectToDatabase();

    const user = await UserModel.findOne({ email: parsed.data.email }).select("+passwordHash");
    const passwordMatches = await verifyPassword(
      parsed.data.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      return apiError(
        "INVALID_CREDENTIALS",
        "メールアドレスまたはパスワードが正しくありません。",
        401,
      );
    }

    const authUser = toAuthUser(user);
    const token = await signSessionToken(authUser.id, authUser.role);
    const response = apiSuccess({ user: authUser });

    setSessionCookie(response, token);
    await clearAuthAttempts(request, "login");
    return response;
  } catch (error) {
    return apiInternalError(
      error,
      "api.auth.login",
      "ログインできません。しばらくしてからお試しください。",
    );
  }
}
