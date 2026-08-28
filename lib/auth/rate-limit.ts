import type { NextRequest } from "next/server";
import {
  clearRateLimit,
  consumeRateLimit,
  getRateLimitIdentifier,
  type RateLimitPolicy,
} from "@/lib/security/rate-limit";

export type AuthRateLimitScope = "login" | "register";

const AUTH_RATE_LIMIT_POLICIES: Record<AuthRateLimitScope, RateLimitPolicy> = {
  login: { scope: "auth-login", limit: 10, windowMs: 15 * 60 * 1000 },
  register: { scope: "auth-register", limit: 10, windowMs: 15 * 60 * 1000 },
};

export async function consumeAuthAttempt(
  request: NextRequest,
  scope: AuthRateLimitScope,
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }> {
  const result = consumeRateLimit(
    await getRateLimitIdentifier(request),
    AUTH_RATE_LIMIT_POLICIES[scope],
  );

  return result.allowed
    ? { allowed: true }
    : { allowed: false, retryAfterSeconds: result.retryAfterSeconds };
}

export async function clearAuthAttempts(
  request: NextRequest,
  scope: AuthRateLimitScope,
): Promise<void> {
  clearRateLimit(await getRateLimitIdentifier(request), AUTH_RATE_LIMIT_POLICIES[scope].scope);
}
