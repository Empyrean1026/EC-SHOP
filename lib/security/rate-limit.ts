import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

type RateLimitEntry = { count: number; resetAt: number };
type RateLimitStore = Map<string, RateLimitEntry>;

const globalForSecurityRateLimit = globalThis as typeof globalThis & {
  securityRateLimitStore?: RateLimitStore;
};

const store =
  globalForSecurityRateLimit.securityRateLimitStore ?? new Map<string, RateLimitEntry>();
globalForSecurityRateLimit.securityRateLimitStore = store;

const MAX_TRACKED_KEYS = 20_000;

export type RateLimitPolicy = {
  scope: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

export const API_RATE_LIMIT_POLICIES = {
  default: { scope: "api", limit: 120, windowMs: 60_000 },
  search: { scope: "api-search", limit: 60, windowMs: 60_000 },
  ai: { scope: "api-ai", limit: 10, windowMs: 60_000 },
  webhook: { scope: "api-webhook", limit: 300, windowMs: 60_000 },
} satisfies Record<string, RateLimitPolicy>;

function pruneStore(now: number) {
  if (store.size < MAX_TRACKED_KEYS) return;

  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }

  while (store.size >= MAX_TRACKED_KEYS) {
    const oldestKey = store.keys().next().value as string | undefined;
    if (!oldestKey) break;
    store.delete(oldestKey);
  }
}

export function consumeRateLimit(
  identifier: string,
  policy: RateLimitPolicy,
  now = Date.now(),
): RateLimitResult {
  const key = `${policy.scope}:${identifier}`;
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    pruneStore(now);
    const resetAt = now + policy.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: policy.limit,
      remaining: Math.max(0, policy.limit - 1),
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil(policy.windowMs / 1000)),
    };
  }

  if (current.count >= policy.limit) {
    return {
      allowed: false,
      limit: policy.limit,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return {
    allowed: true,
    limit: policy.limit,
    remaining: policy.limit - current.count,
    resetAt: current.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function clearRateLimit(identifier: string, scope: string): void {
  store.delete(`${scope}:${identifier}`);
}

async function fingerprint(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest).slice(0, 16), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function getRateLimitIdentifier(request: NextRequest): Promise<string> {
  const trustProxy = process.env.TRUST_PROXY === "true";
  const forwardedIp = trustProxy
    ? request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim()
    : undefined;
  const source =
    forwardedIp ||
    (trustProxy ? request.headers.get("x-real-ip") : undefined) ||
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    `${request.headers.get("user-agent") ?? "unknown"}|${request.headers.get("accept-language") ?? ""}`;

  return fingerprint(source);
}

export function policyForApiPath(pathname: string): RateLimitPolicy {
  if (pathname.startsWith("/api/webhooks/stripe")) return API_RATE_LIMIT_POLICIES.webhook;
  if (pathname.startsWith("/api/ai/shopping")) return API_RATE_LIMIT_POLICIES.ai;
  if (pathname.startsWith("/api/search") || pathname.startsWith("/api/ai/products/search")) {
    return API_RATE_LIMIT_POLICIES.search;
  }
  return API_RATE_LIMIT_POLICIES.default;
}

export function setRateLimitHeaders(headers: Headers, result: RateLimitResult) {
  headers.set("RateLimit-Limit", String(result.limit));
  headers.set("RateLimit-Remaining", String(result.remaining));
  headers.set("RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  if (!result.allowed) headers.set("Retry-After", String(result.retryAfterSeconds));
}
