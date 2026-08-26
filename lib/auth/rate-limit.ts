type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

const globalForRateLimit = globalThis as typeof globalThis & {
  authRateLimitStore?: RateLimitStore;
};

const store = globalForRateLimit.authRateLimitStore ?? new Map<string, RateLimitEntry>();
globalForRateLimit.authRateLimitStore = store;

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const MAX_TRACKED_CLIENTS = 10_000;

export type AuthRateLimitScope = "login" | "register";

function getClientIdentifier(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ??
    "unknown"
  );
}

export function consumeAuthAttempt(
  request: Request,
  scope: AuthRateLimitScope,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  const key = `${scope}:${getClientIdentifier(request)}`;
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    if (store.size >= MAX_TRACKED_CLIENTS) {
      for (const [storedKey, entry] of store) {
        if (entry.resetAt <= now) {
          store.delete(storedKey);
        }
      }

      if (store.size >= MAX_TRACKED_CLIENTS) {
        store.delete(store.keys().next().value as string);
      }
    }

    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (current.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true };
}

export function clearAuthAttempts(request: Request, scope: AuthRateLimitScope): void {
  store.delete(`${scope}:${getClientIdentifier(request)}`);
}
