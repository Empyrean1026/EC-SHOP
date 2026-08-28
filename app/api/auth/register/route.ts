import type { NextRequest } from "next/server";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/request";
import { setSessionCookie } from "@/lib/auth/cookies";
import { validateCsrfRequest } from "@/lib/auth/csrf";
import { toAuthUser } from "@/lib/auth/dto";
import { signSessionToken } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";
import { consumeAuthAttempt } from "@/lib/auth/rate-limit";
import { connectToDatabase } from "@/lib/mongodb";
import { isDuplicateKeyError } from "@/lib/mongodb-errors";
import { UserModel } from "@/models";
import { registerSchema } from "@/lib/validations/auth";
import { getValidationErrors } from "@/lib/validations/errors";

export async function POST(request: NextRequest) {
  if (!(await validateCsrfRequest(request))) {
    return apiError("INVALID_CSRF_TOKEN", "安全令牌无效或已过期。", 403);
  }

  const rateLimit = await consumeAuthAttempt(request, "register");

  if (!rateLimit.allowed) {
    const response = apiError("RATE_LIMITED", "认证请求过于频繁，请稍后重试。", 429);
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request);

  if (!body.success) {
    return apiError(body.code, body.message, body.status);
  }

  const parsed = registerSchema.safeParse(body.data);

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

    const existingUser = await UserModel.exists({ email: parsed.data.email });

    if (existingUser) {
      return apiError("EMAIL_ALREADY_EXISTS", "该邮箱已注册。", 409);
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await UserModel.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "customer",
    });
    const authUser = toAuthUser(user);
    const token = await signSessionToken(authUser.id, authUser.role);
    const response = apiSuccess({ user: authUser }, 201);

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return apiError("EMAIL_ALREADY_EXISTS", "该邮箱已注册。", 409);
    }

    return apiInternalError(error, "api.auth.register", "暂时无法创建账户，请稍后重试。");
  }
}
