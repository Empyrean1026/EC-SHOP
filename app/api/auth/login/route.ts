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
    return apiError("INVALID_CSRF_TOKEN", "安全令牌无效或已过期。", 403);
  }

  const rateLimit = consumeAuthAttempt(request, "login");

  if (!rateLimit.allowed) {
    const response = apiError("RATE_LIMITED", "认证请求过于频繁，请稍后重试。", 429);
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
      "请检查提交的字段。",
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
      return apiError("INVALID_CREDENTIALS", "邮箱或密码不正确。", 401);
    }

    const authUser = toAuthUser(user);
    const token = await signSessionToken(authUser.id, authUser.role);
    const response = apiSuccess({ user: authUser });

    setSessionCookie(response, token);
    clearAuthAttempts(request, "login");
    return response;
  } catch (error) {
    return apiInternalError(error, "api.auth.login", "暂时无法登录，请稍后重试。");
  }
}
